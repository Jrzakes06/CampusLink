import { ArrowLeft, Users, FileText, Link as LinkIcon, MessageCircle, UserPlus, UserCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Avatar } from './Avatar';
import { API_BASE, apiHeaders, apiJsonHeaders } from '../../../utils/api';

interface Post {
  id: string;
  username: string;
  userAvatar: string;
  caption: string;
  media?: Array<{type: 'image' | 'video' | 'file'; url: string}>;
  likes: number;
  createdAt: number;
}

interface UserProfileProps {
  username: string;
  currentUsername: string;
  onBack: () => void;
  onMessage?: (username: string) => void;
}

export function UserProfile({ username, currentUsername, onBack, onMessage }: UserProfileProps) {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [linksCount, setLinksCount] = useState(0);
  const [linkStatus, setLinkStatus] = useState<'none' | 'pending' | 'linked'>('none');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
    fetchUserPosts();
    fetchLinksCount();
    if (currentUsername !== username) {
      checkLinkStatus();
    }
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      // Get all users and find by username
      const response = await fetch(
        `${API_BASE}/admin/users`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const foundUser = data.users?.find((u: any) => u.username === username);
        if (foundUser) {
          setUser(foundUser);
        }
      }
    } catch (error) {
      console.log(`Error fetching user profile: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/posts`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const userPosts = (data.posts || []).filter((p: Post) => p.username === username);
        setPosts(userPosts);
      }
    } catch (error) {
      console.log(`Error fetching user posts: ${error}`);
    }
  };

  const fetchLinksCount = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/links/connections/${username}`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLinksCount(data.connections?.length || 0);
      }
    } catch (error) {
      console.log(`Error fetching links count: ${error}`);
    }
  };

  const checkLinkStatus = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/links/check/${currentUsername}/${username}`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.connected) {
          setLinkStatus('linked');
        } else if (data.pending) {
          setLinkStatus('pending');
        } else {
          setLinkStatus('none');
        }
      }
    } catch (error) {
      console.log(`Error checking link status: ${error}`);
    }
  };

  const handleLinkAction = async () => {
    if (linkStatus === 'none') {
      // Send link request
      try {
        const response = await fetch(
          `${API_BASE}/links/request`,
          {
            method: 'POST',
            headers: apiJsonHeaders(),
            body: JSON.stringify({
              fromUsername: currentUsername,
              toUsername: username,
            }),
          }
        );

        if (response.ok) {
          setLinkStatus('pending');
        }
      } catch (error) {
        console.log(`Error sending link request: ${error}`);
      }
    } else if (linkStatus === 'linked') {
      // Remove connection
      if (confirm(`Remove ${username} from your links?`)) {
        try {
          const response = await fetch(
            `${API_BASE}/links/${currentUsername}/${username}`,
            {
              method: 'DELETE',
              headers: apiHeaders(),
            }
          );

          if (response.ok) {
            setLinkStatus('none');
            setLinksCount(linksCount - 1);
          }
        } catch (error) {
          console.log(`Error removing connection: ${error}`);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">User not found</p>
          <button onClick={onBack} className="text-blue-600 hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">{user.username}</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Cover Image */}
        <div className="relative">
          <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500"></div>

          {/* Profile Picture */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden">
              <Avatar src={user.avatar} username={user.username} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white pt-20 pb-6 px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.fullName || user.username}</h2>
          <p className="text-gray-600 mb-1">{user.role || 'Student'}</p>
          <p className="text-sm text-gray-500 mb-4">{user.university || 'University of Zimbabwe'}</p>

          {/* Action Buttons */}
          {currentUsername !== username && (
            <div className="flex items-center justify-center gap-3 mb-6">
              <button
                onClick={handleLinkAction}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors ${
                  linkStatus === 'linked'
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : linkStatus === 'pending'
                    ? 'bg-gray-200 text-gray-700 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                disabled={linkStatus === 'pending'}
              >
                {linkStatus === 'linked' ? (
                  <>
                    <UserCheck className="w-5 h-5" />
                    Linked
                  </>
                ) : linkStatus === 'pending' ? (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Request Sent
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Link
                  </>
                )}
              </button>
              {onMessage && (
                <button
                  onClick={() => onMessage(username)}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Message
                </button>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{linksCount}</div>
              <div className="text-sm text-gray-600">Links</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
              <div className="text-sm text-gray-600">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {user.kycStatus === 'approved' ? 'Verified' : 'Unverified'}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="bg-white mt-4 px-6 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Posts ({posts.length})
          </h3>

          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p>No posts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {posts.map((post) => {
                const media = post.media && post.media.length > 0 ? post.media[0] : null;
                return (
                  <div key={post.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {media ? (
                      media.type === 'video' ? (
                        <video src={media.url} className="w-full h-full object-cover" />
                      ) : media.type === 'image' ? (
                        <img src={media.url} alt="Post" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 bg-gray-100">
                        <p className="text-xs text-gray-600 line-clamp-4 text-center">{post.caption}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
