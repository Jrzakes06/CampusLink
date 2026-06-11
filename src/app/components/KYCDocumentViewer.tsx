import { X, CheckCircle, XCircle, Download } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from './Avatar';

interface KYCDocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    username: string;
    email: string;
    avatar: string;
    kycFiles?: {
      selfie?: string;
      studentIdFront?: string;
      nationalIdFront?: string;
      nationalIdBack?: string;
      businessCert?: string;
      companyLogo?: string;
    };
    kycSubmittedAt?: number;
  };
  onApprove: (username: string) => void;
  onReject: (username: string) => void;
}

export function KYCDocumentViewer({ isOpen, onClose, user, onApprove, onReject }: KYCDocumentViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  if (!isOpen) return null;

  // Debug: Log the user data
  console.log('🔍 KYC Viewer - User data:', {
    username: user.username,
    email: user.email,
    hasKycFiles: !!user.kycFiles,
    kycFilesKeys: user.kycFiles ? Object.keys(user.kycFiles) : [],
    kycFilesType: typeof user.kycFiles,
    kycFilesContent: user.kycFiles,
  });

  if (user.kycFiles) {
    console.log('🔍 KYC Viewer - Files detail:');
    Object.entries(user.kycFiles).forEach(([key, value]) => {
      if (value) {
        const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
        console.log(`  ${key}:`, {
          type: typeof value,
          isString: typeof value === 'string',
          startsWithData: typeof value === 'string' && value.startsWith('data:'),
          length: valueStr.length,
          preview: valueStr.substring(0, 100) + (valueStr.length > 100 ? '...' : ''),
        });
      } else {
        console.log(`  ${key}: (empty/null)`);
      }
    });
  } else {
    console.warn('⚠️ KYC Files are missing or undefined!');
  }

  const documents = [
    { key: 'selfie', label: '1. Selfie', required: true },
    { key: 'studentIdFront', label: '2. Student ID (Front)', required: true },
    { key: 'nationalIdFront', label: '3. National ID (Front)', required: true },
    { key: 'nationalIdBack', label: '4. National ID (Back)', required: true },
    { key: 'businessCert', label: '5. Business Certificate', required: false },
    { key: 'companyLogo', label: '6. Company Logo', required: false },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 bg-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Avatar
              src={user.avatar}
              username={user.username}
              className="w-12 h-12 rounded-full border-2 border-purple-400"
            />
            <div>
              <h2 className="text-xl font-bold text-white">KYC Review - {user.username}</h2>
              <p className="text-sm text-purple-200">{user.email}</p>
              {user.kycSubmittedAt && (
                <p className="text-xs text-purple-300 mt-1">
                  Submitted {Number(user.kycSubmittedAt) > 0 ? new Date(Number(user.kycSubmittedAt)).toLocaleDateString() : 'Invalid Date'} at {Number(user.kycSubmittedAt) > 0 ? new Date(Number(user.kycSubmittedAt)).toLocaleTimeString() : ''}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Document List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-4">Uploaded Documents</h3>
            {documents.map((doc) => {
              const hasDoc = user.kycFiles && user.kycFiles[doc.key as keyof typeof user.kycFiles];
              const docData = hasDoc ? user.kycFiles![doc.key as keyof typeof user.kycFiles] : null;

              if (!hasDoc) {
                console.log(`📄 Document ${doc.key}: NOT FOUND in kycFiles`, {
                  availableKeys: user.kycFiles ? Object.keys(user.kycFiles) : 'kycFiles is empty/undefined',
                });
              } else {
                console.log(`✅ Document ${doc.key}: FOUND`, {
                  type: typeof docData,
                  size: typeof docData === 'string' ? docData.length : 0,
                });
              }

              return (
                <button
                  key={doc.key}
                  onClick={() => {
                    if (docData) {
                      console.log(`📸 Viewing document: ${doc.key}`, {
                        length: typeof docData === 'string' ? docData.length : 0,
                        preview: typeof docData === 'string' ? docData.substring(0, 100) : docData,
                      });
                      setSelectedDoc(typeof docData === 'string' ? docData : JSON.stringify(docData));
                    }
                  }}
                  className={`w-full p-4 rounded-lg border transition-all text-left ${
                    hasDoc
                      ? 'bg-white/10 border-green-400/50 hover:bg-white/20 cursor-pointer'
                      : 'bg-white/5 border-red-400/50 cursor-not-allowed'
                  }`}
                  disabled={!hasDoc}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {hasDoc ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <div>
                        <p className="font-medium text-white">{doc.label}</p>
                        <p className="text-xs text-purple-300">
                          {doc.required ? 'Required' : 'Optional'} {!hasDoc && '- Not uploaded'}
                        </p>
                      </div>
                    </div>
                    {hasDoc && (
                      <Download className="w-5 h-5 text-purple-300" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Document Preview */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Document Preview</h3>
            {selectedDoc ? (
              <div className="relative aspect-[3/4] bg-black/20 rounded-lg overflow-hidden">
                {typeof selectedDoc === 'string' && selectedDoc.startsWith('data:image') ? (
                  <img
                    src={selectedDoc}
                    alt="Document preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('Failed to load image:', selectedDoc.substring(0, 50) + '...');
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ctext x="50" y="50" font-size="14" fill="white" text-anchor="middle"%3EImage Error%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : typeof selectedDoc === 'string' && selectedDoc.startsWith('data:application/pdf') ? (
                  <div className="w-full h-full flex items-center justify-center text-purple-200">
                    <div className="text-center">
                      <p className="mb-2">PDF Document</p>
                      <a href={selectedDoc} download className="text-purple-400 hover:text-purple-300">
                        Download to view
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-purple-200">
                    <div className="text-center">
                      <p className="mb-2">Unsupported format</p>
                      <p className="text-xs text-purple-400">{typeof selectedDoc === 'string' ? selectedDoc.substring(0, 50) + '...' : 'Invalid data'}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-white/5 rounded-lg border-2 border-dashed border-white/20">
                <p className="text-purple-300">Click a document to preview</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/20 bg-white/5 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onReject(user.username);
              onClose();
            }}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Reject
          </button>
          <button
            onClick={() => {
              onApprove(user.username);
              onClose();
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
