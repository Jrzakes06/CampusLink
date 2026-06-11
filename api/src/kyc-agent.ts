import type { Sql } from './types';

export type KycVerificationResult = {
  decision: 'approve' | 'reject' | 'manual_review';
  confidence: number;
  reasons: string[];
  documentChecks: Record<string, 'pass' | 'fail' | 'unclear' | 'not_required' | 'missing'>;
  verifiedAt: number;
  provider: 'openai' | 'rules';
};

export type KycUser = {
  username: string;
  email: string;
  full_name: string;
  university: string;
  role: string;
  kyc_files: Record<string, string>;
};

const APPROVE_THRESHOLD = 0.82;
const REJECT_THRESHOLD = 0.85;
const MAX_IMAGE_CHARS = 1_200_000;

export async function ensureKycVerificationColumn(sql: Sql) {
  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS kyc_verification JSONB DEFAULT NULL
  `;
}

function isValidImage(data?: string) {
  if (typeof data !== 'string' || data.length < 20) return false;
  if (data.startsWith('http://') || data.startsWith('https://')) return true;
  return data.startsWith('data:image') && data.length > 500;
}

function rulesCheck(user: KycUser, files: Record<string, string>): KycVerificationResult {
  const isSeller = user.role === 'seller' || user.role === 'both';
  const checks: KycVerificationResult['documentChecks'] = {
    selfie: isValidImage(files.selfie) ? 'pass' : 'missing',
    studentId: isValidImage(files.studentIdFront) ? 'pass' : 'missing',
    nationalId: isValidImage(files.nationalIdFront) ? 'pass' : 'missing',
    nationalIdBack: isValidImage(files.nationalIdBack) ? 'pass' : 'unclear',
    businessCert: isSeller
      ? isValidImage(files.businessCert)
        ? 'pass'
        : 'missing'
      : 'not_required',
  };

  const reasons: string[] = [];
  const requiredFails: string[] = [];

  if (checks.selfie === 'missing') requiredFails.push('selfie');
  if (checks.studentId === 'missing') requiredFails.push('student ID (front)');
  if (checks.nationalId === 'missing') requiredFails.push('national ID (front)');
  if (isSeller && checks.businessCert === 'missing') requiredFails.push('business certificate');

  if (requiredFails.length > 0) {
    reasons.push(`Missing required documents: ${requiredFails.join(', ')}`);
    return {
      decision: 'reject',
      confidence: 0.92,
      reasons,
      documentChecks: checks,
      verifiedAt: Date.now(),
      provider: 'rules',
    };
  }

  reasons.push('All required documents uploaded. Configure OPENAI_API_KEY for AI vision review.');
  return {
    decision: 'manual_review',
    confidence: 0.5,
    reasons,
    documentChecks: checks,
    verifiedAt: Date.now(),
    provider: 'rules',
  };
}

function buildImageContent(files: Record<string, string>) {
  const labels: Array<{ key: string; label: string }> = [
    { key: 'selfie', label: 'Selfie' },
    { key: 'studentIdFront', label: 'Student ID (front)' },
    { key: 'nationalIdFront', label: 'National ID (front)' },
    { key: 'nationalIdBack', label: 'National ID (back)' },
    { key: 'businessCert', label: 'Business certificate' },
  ];

  const content: Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }> = [];
  for (const { key, label } of labels) {
    const data = files[key];
    if (!isValidImage(data)) continue;
    if (data.length > MAX_IMAGE_CHARS) {
      content.push({ type: 'text', text: `${label}: [image too large for AI review]` });
      continue;
    }
    content.push({ type: 'text', text: `Document: ${label}` });
    content.push({
      type: 'image_url',
      image_url: { url: data, detail: 'low' },
    });
  }
  return content;
}

async function openAiVerify(
  apiKey: string,
  user: KycUser,
  files: Record<string, string>,
): Promise<KycVerificationResult> {
  const isSeller = user.role === 'seller' || user.role === 'both';
  const imageContent = buildImageContent(files);

  if (imageContent.length === 0) {
    return rulesCheck(user, files);
  }

  const prompt = `You are a KYC verification agent for CampusLink, a Zimbabwe university student marketplace.

User profile:
- Full name: ${user.full_name}
- Username: ${user.username}
- University: ${user.university}
- Role: ${user.role}${isSeller ? ' (seller — business certificate required)' : ''}

Review the uploaded identity documents. Check:
1. Required docs present and readable (selfie, student ID front, national ID front)
2. Selfie appears to match the person on the student ID
3. Name on documents plausibly matches profile name (allow minor spelling differences)
4. Documents look like real photos of physical IDs (not blank, not obvious fakes)
5. For sellers: business certificate is present and readable

Be conservative: use "manual_review" when uncertain. Only "approve" when clearly legitimate.

Respond with JSON only:
{
  "decision": "approve" | "reject" | "manual_review",
  "confidence": 0.0 to 1.0,
  "reasons": ["short reason strings"],
  "documentChecks": {
    "selfie": "pass"|"fail"|"unclear",
    "studentId": "pass"|"fail"|"unclear",
    "nationalId": "pass"|"fail"|"unclear",
    "nationalIdBack": "pass"|"fail"|"unclear"|"not_required",
    "businessCert": "pass"|"fail"|"unclear"|"not_required"
  }
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }, ...imageContent],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty AI response');

  const parsed = JSON.parse(raw) as Omit<KycVerificationResult, 'verifiedAt' | 'provider'>;
  return {
    decision: parsed.decision || 'manual_review',
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons : ['AI review completed'],
    documentChecks: parsed.documentChecks || {},
    verifiedAt: Date.now(),
    provider: 'openai',
  };
}

export async function runKycVerification(
  user: KycUser,
  openaiKey?: string,
): Promise<KycVerificationResult> {
  const files = (user.kyc_files || {}) as Record<string, string>;

  if (openaiKey) {
    try {
      return await openAiVerify(openaiKey, user, files);
    } catch (err) {
      const fallback = rulesCheck(user, files);
      fallback.reasons.push(`AI review failed: ${err instanceof Error ? err.message : String(err)}`);
      fallback.decision = 'manual_review';
      fallback.confidence = 0.4;
      return fallback;
    }
  }

  return rulesCheck(user, files);
}

export function resolveKycStatus(result: KycVerificationResult): 'approved' | 'rejected' | 'pending' {
  if (result.decision === 'approve' && result.confidence >= APPROVE_THRESHOLD) return 'approved';
  if (result.decision === 'reject' && result.confidence >= REJECT_THRESHOLD) return 'rejected';
  return 'pending';
}

export async function verifyAndApplyKyc(
  sql: Sql,
  username: string,
  openaiKey?: string,
): Promise<{ kycStatus: string; verification: KycVerificationResult } | null> {
  await ensureKycVerificationColumn(sql);

  const rows = await sql`
    SELECT username, email, full_name, university, role, kyc_files, kyc_status, kyc_verification
    FROM users WHERE username = ${username} LIMIT 1
  `;
  if (!rows.length) return null;

  const user = rows[0];
  if (user.kyc_status !== 'pending') {
    return {
      kycStatus: user.kyc_status as string,
      verification: (user.kyc_verification as KycVerificationResult) || {
        decision: 'manual_review',
        confidence: 0,
        reasons: ['Not pending verification'],
        documentChecks: {},
        verifiedAt: Date.now(),
        provider: 'rules',
      },
    };
  }

  const verification = await runKycVerification(
    {
      username: user.username as string,
      email: user.email as string,
      full_name: user.full_name as string,
      university: user.university as string,
      role: user.role as string,
      kyc_files: (user.kyc_files || {}) as Record<string, string>,
    },
    openaiKey,
  );

  const kycStatus = resolveKycStatus(verification);

  await sql`
    UPDATE users
    SET kyc_status = ${kycStatus},
        kyc_verification = ${JSON.stringify(verification)}::jsonb
    WHERE username = ${username}
  `;

  return { kycStatus, verification };
}
