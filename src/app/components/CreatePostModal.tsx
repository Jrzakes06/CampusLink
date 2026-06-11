import { X, Image as ImageIcon, Video, Paperclip } from 'lucide-react';
import { useState } from 'react';
import { uploadFile } from '../../../utils/upload';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (caption: string, media: Array<{type: 'image' | 'video' | 'file'; url: string; name?: string}>) => void;
  isVerified?: boolean;
}

export function CreatePostModal({ isOpen, onClose, onSubmit, isVerified }: CreatePostModalProps) {
  const [caption, setCaption] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  if (!isOpen) return null;

  if (isVerified === false) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Required</h2>
            <p className="text-gray-600 mb-6">
              You need to complete KYC verification before you can create posts. Please complete your verification in the Profile section.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>, mediaType: 'image' | 'video' | 'attachment') => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      if (mediaType === 'image') {
        setImageFiles([...imageFiles, ...files]);
      } else if (mediaType === 'video') {
        setVideoFiles([...videoFiles, ...files]);
      } else if (mediaType === 'attachment') {
        setAttachmentFiles([...attachmentFiles, ...files]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allMedia = [...imageFiles, ...videoFiles, ...attachmentFiles];

    if (!caption.trim() && allMedia.length === 0) {
      alert('Please enter text or select media files before posting.');
      return;
    }

    try {
      const media = await Promise.all(
        allMedia.map(async (file) => {
          let fileType: 'image' | 'video' | 'file' = 'file';
          if (file.type.startsWith('video')) fileType = 'video';
          else if (file.type.startsWith('image')) fileType = 'image';
          const url = await uploadFile(file);
          return { type: fileType, url, name: file.name };
        }),
      );
      onSubmit(caption, media);
      setCaption('');
      setImageFiles([]);
      setVideoFiles([]);
      setAttachmentFiles([]);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload media. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-slate-950">Create New Post</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-950" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-950">What's on your head?</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share a campus update, ask a question, or post a listing for students and employers."
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {(imageFiles.length > 0 || videoFiles.length > 0 || attachmentFiles.length > 0) && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-950">
                Selected Media ({imageFiles.length + videoFiles.length + attachmentFiles.length})
              </p>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                {imageFiles.map((file, idx) => (
                  <div key={`img-${idx}`} className="flex items-center justify-between rounded bg-white p-2 border border-slate-200">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-950 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageFiles(imageFiles.filter((_, i) => i !== idx))}
                      className="ml-2 p-1 hover:bg-slate-100 rounded"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                ))}
                {videoFiles.map((file, idx) => (
                  <div key={`vid-${idx}`} className="flex items-center justify-between rounded bg-white p-2 border border-slate-200">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Video className="w-4 h-4 text-purple-600" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-950 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVideoFiles(videoFiles.filter((_, i) => i !== idx))}
                      className="ml-2 p-1 hover:bg-slate-100 rounded"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                ))}
                {attachmentFiles.map((file, idx) => (
                  <div key={`att-${idx}`} className="flex items-center justify-between rounded bg-white p-2 border border-slate-200">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Paperclip className="w-4 h-4 text-green-600" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-950 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachmentFiles(attachmentFiles.filter((_, i) => i !== idx))}
                      className="ml-2 p-1 hover:bg-slate-100 rounded"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleMediaChange(e, 'image')}
              className="hidden"
              id="image-input"
            />
            <button
              type="button"
              onClick={() => (document.getElementById('image-input') as HTMLInputElement)?.click()}
              className="flex flex-col items-center gap-1 border border-slate-300 rounded-lg p-3 hover:bg-slate-50 transition-colors"
            >
              <ImageIcon className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-medium text-slate-950">Image</span>
            </button>

            <input
              type="file"
              accept="video/*"
              multiple
              onChange={(e) => handleMediaChange(e, 'video')}
              className="hidden"
              id="video-input"
            />
            <button
              type="button"
              onClick={() => (document.getElementById('video-input') as HTMLInputElement)?.click()}
              className="flex flex-col items-center gap-1 border border-slate-300 rounded-lg p-3 hover:bg-slate-50 transition-colors"
            >
              <Video className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-medium text-slate-950">Video</span>
            </button>

            <input
              type="file"
              multiple
              onChange={(e) => handleMediaChange(e, 'attachment')}
              className="hidden"
              id="attachment-input"
            />
            <button
              type="button"
              onClick={() => (document.getElementById('attachment-input') as HTMLInputElement)?.click()}
              className="flex flex-col items-center gap-1 border border-slate-300 rounded-lg p-3 hover:bg-slate-50 transition-colors"
            >
              <Paperclip className="w-5 h-5 text-green-600" />
              <span className="text-xs font-medium text-slate-950">Attach</span>
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Share
          </button>
        </form>
      </div>
    </div>
  );
}
