import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2, Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from './Avatar';

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
}

interface Post {
  id: string;
  username: string;
  userAvatar: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked?: boolean;
  media?: Array<{type: 'image' | 'video' | 'file'; url: string; name?: string}>;
  createdAt?: number;
}

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onReport?: (username: string, postId: string) => void;
  onProfileClick?: (username: string) => void;
  currentUsername?: string;
}

export function PostCard({ post, onLike, isAdmin, onDelete, onReport, onProfileClick, currentUsername }: PostCardProps) {
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const truncatedCaption = post.caption.length > 100
    ? post.caption.slice(0, 100) + '...'
    : post.caption;

  const media = post.media && post.media.length > 0 ? post.media : (post.imageUrl ? [{type: 'image' as const, url: post.imageUrl}] : []);
  const hasMedia = media.length > 0;

  return (
    <div className="rounded-[2rem] border border-slate-700/70 bg-slate-950/90 shadow-xl overflow-hidden max-w-2xl mx-auto">
      <div className="flex items-center justify-between px-4 py-3 text-slate-100">
        <button
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          onClick={() => onProfileClick && onProfileClick(post.username)}
        >
          <Avatar
            src={post.userAvatar}
            username={post.username}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="font-semibold text-sm text-slate-100">{post.username}</span>
        </button>
        <div className="relative">
          <button className="p-1 text-slate-100" onClick={() => setShowMenu(!showMenu)}>
            <MoreHorizontal className="w-5 h-5 text-slate-100" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-700/80 bg-slate-950 text-slate-100 shadow-2xl z-10">
              {isAdmin && onDelete && (
                <button
                  onClick={() => {
                    onDelete(post.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-900/90 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Post (Admin)
                </button>
              )}
              {!isAdmin && onDelete && currentUsername === post.username && (
                <button
                  onClick={() => {
                    onDelete(post.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Post
                </button>
              )}
              {onReport && currentUsername !== post.username && (
                <button
                  onClick={() => {
                    onReport(post.username, post.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-900/90 flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  Report User
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {hasMedia && (
        <div className="relative w-full aspect-square bg-gray-100 max-h-96 object-cover">
          {media[currentMediaIndex].type === 'video' ? (
            <video
              src={media[currentMediaIndex].url}
              className="w-full h-full object-cover"
              controls
            />
          ) : (
            <img
              src={media[currentMediaIndex].url}
              alt="Post"
              className="w-full h-full object-cover"
            />
          )}

          {media.length > 1 && (
            <>
              <button
                onClick={() => setCurrentMediaIndex((currentMediaIndex - 1 + media.length) % media.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentMediaIndex((currentMediaIndex + 1) % media.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-semibold">
                {currentMediaIndex + 1} / {media.length}
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {media.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentMediaIndex(idx)}
                    className={`h-2 rounded-full transition ${
                      idx === currentMediaIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="px-4 py-3 space-y-3 text-slate-100">
        <div className="text-sm text-slate-200">
          <span className="font-semibold text-slate-100 mr-2">{post.username}</span>
          <span>
            {showFullCaption ? post.caption : truncatedCaption}
            {post.caption.length > 100 && (
              <button
                onClick={() => setShowFullCaption(!showFullCaption)}
                className="text-slate-300 ml-1"
              >
                {showFullCaption ? 'less' : 'more'}
              </button>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(post.id)}
              className="hover:opacity-70 transition-opacity"
            >
              <Heart
                className={`w-6 h-6 text-slate-100 ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`}
              />
            </button>
            <button className="hover:opacity-70 transition-opacity">
              <MessageCircle className="w-6 h-6 text-slate-100" />
            </button>
            <button className="hover:opacity-70 transition-opacity">
              <Send className="w-6 h-6 text-slate-100" />
            </button>
          </div>
          <button className="hover:opacity-80 transition-opacity text-slate-200">
            <Bookmark className="w-6 h-6 text-slate-200" />
          </button>
        </div>

        <div>
          <p className="font-semibold text-sm text-slate-100">{post.likes.toLocaleString()} likes</p>
        </div>

        {post.comments > 0 && (
          <div>
            <button
              onClick={() => setShowComments(!showComments)}
              className="text-sm text-slate-300 hover:text-slate-100 transition"
            >
              {showComments ? 'Hide comments' : `View all ${post.comments} comments`}
            </button>
            {showComments && (
              <div className="mt-3 space-y-2 rounded-3xl bg-slate-900/80 p-3 text-slate-200">
                <p className="text-sm text-slate-100">Comments will appear here.</p>
                <p className="text-xs text-slate-400">Click a comment to expand.</p>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-slate-500 uppercase">{post.createdAt ? getRelativeTime(post.createdAt) : post.timestamp}</p>
      </div>
    </div>
  );
}
