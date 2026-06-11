import type { Sql } from './types';

export type ConversationMetadata = {
  type?: 'marketplace' | 'job';
  title?: string;
};

export async function ensureMetadataColumn(sql: Sql) {
  await sql`
    ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb
  `;
}

export async function findConversationBetween(
  sql: Sql,
  user1: string,
  user2: string,
) {
  const rows = await sql`
    SELECT * FROM conversations
    WHERE participants @> ${JSON.stringify([user1])}::jsonb
      AND participants @> ${JSON.stringify([user2])}::jsonb
      AND jsonb_array_length(participants) = 2
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findOrCreateConversation(
  sql: Sql,
  user1: string,
  user2: string,
  metadata: ConversationMetadata = {},
) {
  const existing = await findConversationBetween(sql, user1, user2);
  if (existing) return existing;

  const participants = [user1, user2].sort();
  const [created] = await sql`
    INSERT INTO conversations (participants, metadata)
    VALUES (${JSON.stringify(participants)}::jsonb, ${JSON.stringify(metadata)}::jsonb)
    RETURNING *
  `;
  return created;
}

export async function formatConversation(
  sql: Sql,
  row: Record<string, unknown>,
  currentUsername?: string,
) {
  const participants = (row.participants as string[]) || [];
  const metadata = (row.metadata as ConversationMetadata) || {};
  const otherUser =
    currentUsername
      ? participants.find((p) => p !== currentUsername) || participants[0] || ''
      : participants.join(' ↔ ') || '';

  let otherUserAvatar = '';
  if (otherUser && !otherUser.includes('↔')) {
    const users = await sql`SELECT avatar FROM users WHERE username = ${otherUser} LIMIT 1`;
    otherUserAvatar = (users[0]?.avatar as string) || '';
  }

  return {
    id: row.id,
    type: metadata.type || 'marketplace',
    otherUser,
    otherUserAvatar,
    lastMessage: row.last_message || '',
    lastMessageTime: row.last_message_time || row.created_at,
    unreadCount: row.unread_count || 0,
    title: metadata.title || 'Chat',
    participants,
  };
}

export function parseLegacyConversationId(id: string): string[] | null {
  if (!id?.startsWith('conv:')) return null;
  const body = id.slice(5);
  const sep = body.indexOf('::');
  if (sep === -1) return null;
  return [body.slice(0, sep), body.slice(sep + 2)];
}

export function legacyConversationId(user1: string, user2: string) {
  return `conv:${[user1, user2].sort().join('::')}`;
}
