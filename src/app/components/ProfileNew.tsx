import { User, Mail, MapPin, Briefcase, CheckCircle, XCircle, Upload, Edit2, Camera, Clock, Settings, Bell, Heart, MessageCircle, Users } from 'lucide-react';
import { Avatar } from './Avatar';
import { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { API_BASE, apiHeaders, apiJsonHeaders } from '../../../utils/api';
import { uploadFile } from '../../../utils/upload';

interface UserProfile {
  username: string;
  email: string;
  location: string;
  bio: string;
  avatar: string;
  fullName: string;
  university: string;
  role: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not-submitted';
  kycDocument?: string;
  applications: number;
  listings: number;
  joinedDate: number;
}

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  createdAt: number;
}

interface ProfileProps {
  userSession?: {
    username: string;
    email: string;
    avatar: string;
    kycStatus: string;
  };
  onKYCStatusUpdate?: (newStatus: string) => void;
  onProfileUpdate?: (updates: { avatar?: string; username?: string; fullName?: string }) => void;
}

const ZIMBABWE_UNIVERSITIES = [
  'Africa University (AU)',
  'Arrupe Jesuit University (AJU)',
  'Bindura University of Science Education (BUSE)',
  'Catholic University of Zimbabwe (CUZ)',
  'Chinhoyi University of Technology (CUT)',
  'Great Zimbabwe University',
  'Gwanda State University (GSU)',
  'Harare Institute of Technology (HIT)',
  'Lupane State University (LSU)',
  'Midlands State University (MSU)',
  'National University of Science and Technology (NUST)',
  'Reformed Church University',
  'Solusi University',
  'University of Zimbabwe (UZ)',
  "Women's University in Africa (WUA)",
  'Zimbabwe Ezekiel Guti University (ZEGU)',
  'Zimbabwe Open University (ZOU)',
];

export function ProfileNew({ userSession, onKYCStatusUpdate, onProfileUpdate }: ProfileProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'kyc' | 'security'>('kyc');
  const [profile, setProfile] = useState<UserProfile>({
    username: userSession?.username || 'you',
    email: userSession?.email || 'you@campus.edu',
    location: 'Zimbabwe',
    bio: '',
    avatar: userSession?.avatar || '',
    fullName: 'Student User',
    university: 'University of Zimbabwe (UZ)',
    role: 'student',
    kycStatus: (userSession?.kycStatus as 'pending' | 'approved' | 'rejected' | 'not-submitted') || 'not-submitted',
    applications: 0,
    listings: 0,
    joinedDate: Date.now(),
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);
  const [kycFiles, setKycFiles] = useState<{
    selfie?: File;
    studentIdFront?: File;
    nationalIdFront?: File;
    nationalIdBack?: File;
    businessCert?: File;
    companyLogo?: File;
  }>({});
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userConnections, setUserConnections] = useState<any[]>([]);
  const [kycError, setKycError] = useState<string>('');
  const [activeMediaTab, setActiveMediaTab] = useState<'posts' | 'connections'>('posts');
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: 'idle' | 'converting' | 'done'}>({});

  useEffect(() => {
    fetchApplications();
    fetchUserProfile();
    fetchUserPosts();
    fetchUserConnections();
  }, []);

  // Update local profile when userSession changes
  useEffect(() => {
    if (userSession) {
      setProfile(prev => ({
        ...prev,
        username: userSession.username || prev.username,
        email: userSession.email || prev.email,
        avatar: userSession.avatar || prev.avatar,
        kycStatus: (userSession.kycStatus as 'pending' | 'approved' | 'rejected' | 'not-submitted') || prev.kycStatus,
      }));
    }
  }, [userSession?.avatar, userSession?.username, userSession?.email, userSession?.kycStatus]);

  const fetchUserProfile = async () => {
    if (!userSession?.email) return;

    try {
      const response = await fetch(
        `${API_BASE}/user/profile/${userSession.email}`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setProfile(prev => ({
            ...prev,
            username: data.user.username || prev.username,
            fullName: data.user.fullName || prev.fullName,
            university: data.user.university || prev.university,
            role: data.user.role || prev.role,
            avatar: data.user.avatar || prev.avatar,
            bio: data.user.bio || prev.bio,
            kycStatus: data.user.kycStatus || prev.kycStatus,
            createdAt: data.user.createdAt || prev.createdAt,
          }));
        }
      }
    } catch (error) {
      console.log(`Error fetching user profile: ${error}`);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/applications/${profile.username}`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
        setProfile(prev => ({ ...prev, applications: data.applications?.length || 0 }));
      }
    } catch (error) {
      console.log(`Error fetching applications: ${error}`);
    }
  };

  const fetchUserPosts = async () => {
    if (!userSession?.username) return;

    try {
      const response = await fetch(
        `${API_BASE}/posts`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const myPosts = data.posts?.filter((p: any) => p.username === userSession.username) || [];
        setUserPosts(myPosts);
      }
    } catch (error) {
      console.log(`Error fetching user posts: ${error}`);
    }
  };

  const fetchUserConnections = async () => {
    if (!userSession?.username) return;

    try {
      const response = await fetch(
        `${API_BASE}/links/connections/${userSession.username}`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserConnections(data.connections || []);
      }
    } catch (error) {
      console.log(`Error fetching connections: ${error}`);
    }
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      // Convert to base64 and update preview
      const reader = new FileReader();
      reader.onload = () => {
        setProfile(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitKYC = async () => {
    if (!kycFiles.selfie || !kycFiles.studentIdFront || !kycFiles.nationalIdFront || !kycFiles.nationalIdBack) {
      alert('Please upload all required documents');
      return;
    }

    setIsSubmittingKYC(true);
    setKycError('');
    setUploadProgress({});

    try {
      const uploadKycFile = async (file: File, fileName: string): Promise<string> => {
        setUploadProgress(prev => ({ ...prev, [fileName]: 'uploading' }));
        const url = await uploadFile(file);
        setUploadProgress(prev => ({ ...prev, [fileName]: 'done' }));
        return url;
      };

      const kycFilesData: Record<string, string> = {};

      if (kycFiles.selfie) {
        kycFilesData.selfie = await uploadKycFile(kycFiles.selfie, 'selfie');
      }
      if (kycFiles.studentIdFront) {
        kycFilesData.studentIdFront = await uploadKycFile(kycFiles.studentIdFront, 'studentIdFront');
      }
      if (kycFiles.nationalIdFront) {
        kycFilesData.nationalIdFront = await uploadKycFile(kycFiles.nationalIdFront, 'nationalIdFront');
      }
      if (kycFiles.nationalIdBack) {
        kycFilesData.nationalIdBack = await uploadKycFile(kycFiles.nationalIdBack, 'nationalIdBack');
      }
      if (kycFiles.businessCert) {
        kycFilesData.businessCert = await uploadKycFile(kycFiles.businessCert, 'businessCert');
      }
      if (kycFiles.companyLogo) {
        kycFilesData.companyLogo = await uploadKycFile(kycFiles.companyLogo, 'companyLogo');
      }

      console.log('📤 Submitting KYC with files:', Object.keys(kycFilesData));
      console.log('📊 File sizes:', Object.entries(kycFilesData).map(([key, val]: [string, any]) =>
        `${key}: ${(val.length / 1024).toFixed(2)} KB`
      ));

      const response = await fetch(
        `${API_BASE}/kyc/submit`,
        {
          method: 'POST',
          headers: apiJsonHeaders(),
          body: JSON.stringify({
            email: profile.email,
            username: profile.username,
            kycFiles: kycFilesData,
          }),
        }
      );

      console.log('📡 Response status:', response.status);
      const responseText = await response.text();
      console.log('📡 Response body:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        console.log('✅ KYC submission successful:', data);

        setProfile(prev => ({
          ...prev,
          kycStatus: data.kycStatus,
        }));
        if (onKYCStatusUpdate) {
          onKYCStatusUpdate(data.kycStatus);
        }
        setKycFiles({});
        setUploadProgress({});
        setShowSettings(false);
        const aiNote = data.verification
          ? `\n\nAI agent: ${data.verification.decision} (${Math.round((data.verification.confidence || 0) * 100)}% confidence)`
          : '';
        alert(`${data.message || 'KYC submitted.'}${aiNote}`);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('KYC Submission Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url: `${API_BASE}/kyc/submit`,
        });

        let errorMessage = 'Failed to submit KYC. ';
        let diagnosticMessage = '';

        if (errorData.details && errorData.details.includes('relation') && errorData.details.includes('does not exist')) {
          errorMessage += 'Database tables not set up!';
          diagnosticMessage = `The database tables have not been created yet. Please follow these steps:

1. Go to Neon SQL Editor: https://console.neon.tech
2. Copy ALL SQL from database-schema-neon.sql in your project
3. Paste and click "Run"
4. Try submitting KYC again`;
        } else if (errorData.error) {
          errorMessage += errorData.error;
          diagnosticMessage = errorData.details || 'Check browser console (F12) for more details';
        } else {
          errorMessage += 'Please check console for details.';
          diagnosticMessage = 'Unknown error occurred. Check browser console (F12) for details';
        }

        setKycError(diagnosticMessage);
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error('KYC Submission Exception:', {
        error: error,
        message: error?.message,
        stack: error?.stack,
      });
      const errorMsg = error?.message || 'Network error. Please check your connection.';
      setKycError(`Exception: ${errorMsg}\n\nMake sure:\n1. Edge Function is deployed\n2. Database tables are created\n3. Internet connection is stable`);
      alert(`Failed to submit KYC: ${errorMsg}`);
    } finally {
      setIsSubmittingKYC(false);
      setUploadProgress({});
    }
  };

  const handleSaveProfile = async () => {
    try {
      let avatarUrl = profile.avatar;
      if (profilePictureFile) {
        avatarUrl = await uploadFile(profilePictureFile);
      }

      const response = await fetch(
        `${API_BASE}/profile/update`,
        {
          method: 'POST',
          headers: apiJsonHeaders(),
          body: JSON.stringify({
            email: profile.email,
            updates: {
              avatar: avatarUrl,
              username: profile.username,
              fullName: profile.fullName,
              university: profile.university,
              role: profile.role,
              bio: profile.bio,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Update parent session with new profile data
        if (onProfileUpdate) {
          onProfileUpdate({
            avatar: avatarUrl,
            username: profile.username,
            fullName: profile.fullName,
          });
        }

        // Re-fetch profile to ensure it's saved
        await fetchUserProfile();

        alert('Profile updated successfully!');
        setIsEditingProfile(false);
        setProfilePictureFile(null);
      } else {
        const errorData = await response.json();
        console.log(`Error updating profile: ${JSON.stringify(errorData)}`);
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.log(`Error updating profile: ${error}`);
      alert('Failed to update profile. Please try again.');
    }
  };

  const showKYCBadge = profile.kycStatus === 'not-submitted' || profile.kycStatus === 'rejected';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-xl border-b border-slate-700/80 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
          <button
            onClick={() => setShowSettings(true)}
            className="relative p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <Settings className="w-6 h-6 text-white" />
            {showKYCBadge && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-purple-900 flex items-center justify-center">
                <Bell className="w-2.5 h-2.5 text-white" />
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pb-8">
        {/* Profile Header */}
        <div className="relative">
          {/* Cover Photo */}
          <div className="h-48 rounded-[2rem] overflow-hidden bg-slate-900/80 border border-slate-700/70 relative shadow-inner shadow-slate-950/40">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.2),_transparent_40%),_linear-gradient(180deg,rgba(15,23,42,0.35),rgba(15,23,42,0.75))]"></div>
          </div>

          {/* Profile Picture */}
          <div className="px-6 -mt-16 relative">
            <div className="relative inline-block">
              <Avatar
                src={profile.avatar}
                username={profile.username}
                className="w-32 h-32 rounded-full border-4 border-slate-950"
              />
              {!isEditingProfile && (
                <label className="absolute bottom-2 right-2 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-700 transition-colors shadow-lg">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </label>
              )}
              {profile.kycStatus === 'approved' && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 p-1.5 rounded-full border-2 border-purple-900">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-6 mt-4">
          {!isEditingProfile ? (
            <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-700/70 rounded-[2rem] p-6 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.9)]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">{profile.fullName}</h2>
                  <p className="text-slate-300 mb-2">@{profile.username}</p>
                  {profile.bio && <p className="text-slate-300 mb-3">{profile.bio}</p>}
                  <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      <span>{profile.university}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span>{profile.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsEditingProfile(true)}
                className="w-full px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors border border-white/20 mb-4"
              >
                <Edit2 className="w-4 h-4 inline mr-2" />
                Edit Profile
              </button>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/20 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{userPosts.length}</p>
                  <p className="text-sm text-slate-400">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{userConnections.length}</p>
                  <p className="text-sm text-slate-400">Links</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{profile.applications}</p>
                  <p className="text-sm text-slate-400">Applications</p>
                </div>
              </div>

              {/* Media Tabs */}
              <div className="flex gap-2 border-b border-white/20 mb-4">
                <button
                  onClick={() => setActiveMediaTab('posts')}
                  className={`flex-1 py-3 font-medium transition-colors ${
                    activeMediaTab === 'posts'
                      ? 'text-white border-b-2 border-blue-400'
                      : 'text-slate-400'
                  }`}
                >
                  Posts
                </button>
                <button
                  onClick={() => setActiveMediaTab('connections')}
                  className={`flex-1 py-3 font-medium transition-colors ${
                    activeMediaTab === 'connections'
                      ? 'text-white border-b-2 border-blue-400'
                      : 'text-slate-400'
                  }`}
                >
                  Links
                </button>
              </div>

              {/* Posts Grid */}
              {activeMediaTab === 'posts' && (
                <div className="grid grid-cols-3 gap-1">
                  {userPosts.length === 0 ? (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-slate-400">No posts yet</p>
                    </div>
                  ) : (
                    userPosts.map((post) => (
                      <div key={post.id} className="aspect-square bg-slate-900/70 rounded-3xl overflow-hidden relative group border border-slate-700/70">
                        {post.imageUrl ? (
                          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600">
                            <p className="text-white text-xs px-2 text-center line-clamp-3">{post.caption}</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <span className="flex items-center gap-1 text-white">
                            <Heart className="w-5 h-5" fill="white" />
                            {post.likes}
                          </span>
                          <span className="flex items-center gap-1 text-white">
                            <MessageCircle className="w-5 h-5" fill="white" />
                            {post.comments}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Connections List */}
              {activeMediaTab === 'connections' && (
                <div className="space-y-3">
                  {userConnections.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-400">No connections yet</p>
                    </div>
                  ) : (
                    userConnections.map((connection) => (
                      <div key={connection.id} className="flex items-center gap-3 p-3 bg-slate-900/80 rounded-[1.5rem] border border-slate-700/60 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.7)]">
                        <Avatar
                          src=""
                          username={connection.user2}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="text-white font-medium">@{connection.user2}</p>
                          <p className="text-sm text-slate-400">
                            Connected {Number(connection.created_at || connection.createdAt) > 0 ? new Date(Number(connection.created_at || connection.createdAt)).toLocaleDateString() : 'Invalid Date'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Edit Profile Form */
            <div className="bg-slate-950/80 backdrop-blur-xl rounded-[2rem] border border-slate-700/70 p-6 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.9)]">
              <h3 className="text-xl font-bold text-white mb-6">Edit Profile</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/70 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/70 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/70 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">University</label>
                  <select
                    value={profile.university}
                    onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/70 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ZIMBABWE_UNIVERSITIES.map((uni) => (
                      <option key={uni} value={uni} className="bg-purple-900">
                        {uni}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950/95 rounded-2xl border border-slate-700/70 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-[0_30px_90px_-35px_rgba(15,23,42,0.9)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setKycError('');
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/20">
              <button
                onClick={() => setSettingsTab('kyc')}
                className={`flex-1 py-4 px-6 font-medium transition-colors relative ${
                  settingsTab === 'kyc' ? 'text-white' : 'text-slate-400'
                }`}
              >
                KYC Verification
                {showKYCBadge && (
                  <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
                {settingsTab === 'kyc' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>
                )}
              </button>
              <button
                onClick={() => setSettingsTab('security')}
                className={`flex-1 py-4 px-6 font-medium transition-colors relative ${
                  settingsTab === 'security' ? 'text-white' : 'text-slate-400'
                }`}
              >
                Security
                {settingsTab === 'security' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {settingsTab === 'kyc' && (
                <>
                  {profile.kycStatus === 'not-submitted' && (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Complete KYC Verification</h3>
                      <p className="text-slate-300 mb-6">Upload the following documents to verify your identity:</p>

                      {kycError && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <div className="flex gap-3">
                            <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-white mb-2">Setup Required</h4>
                              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{kycError}</pre>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-white mb-3">Required Documents:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FileUpload
                              label="1. Selfie"
                              onUpload={(file) => setKycFiles(prev => ({ ...prev, selfie: file }))}
                              required
                            />
                            <FileUpload
                              label="2. Student ID (Front)"
                              onUpload={(file) => setKycFiles(prev => ({ ...prev, studentIdFront: file }))}
                              required
                            />
                            <FileUpload
                              label="3. National ID (Front)"
                              onUpload={(file) => setKycFiles(prev => ({ ...prev, nationalIdFront: file }))}
                              required
                            />
                            <FileUpload
                              label="4. National ID (Back)"
                              onUpload={(file) => setKycFiles(prev => ({ ...prev, nationalIdBack: file }))}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-white mb-3">Optional Documents:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FileUpload
                              label="Business Certificate"
                              onUpload={(file) => setKycFiles(prev => ({ ...prev, businessCert: file }))}
                              accept=".pdf,image/*"
                            />
                            <FileUpload
                              label="Company Logo"
                              onUpload={(file) => setKycFiles(prev => ({ ...prev, companyLogo: file }))}
                            />
                          </div>
                        </div>

                        {/* Upload Progress */}
                        {Object.keys(uploadProgress).length > 0 && (
                          <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/20">
                            <p className="text-sm font-semibold text-white mb-3">Upload Progress:</p>
                            <div className="space-y-2">
                              {Object.entries(uploadProgress).map(([key, status]) => (
                                <div key={key} className="flex items-center gap-3">
                                  {status === 'converting' && (
                                    <div className="animate-spin w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full"></div>
                                  )}
                                  {status === 'done' && (
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                  )}
                                  <span className="text-sm text-slate-300 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}: {status === 'converting' ? 'Converting...' : 'Done ✓'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-3 border-t border-white/20">
                          <button
                            onClick={handleSubmitKYC}
                            disabled={isSubmittingKYC}
                            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isSubmittingKYC ? (
                              <>
                                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                                Processing...
                              </>
                            ) : (
                              'Submit for Verification'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.kycStatus === 'pending' && (
                    <div className="text-center py-8">
                      <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">KYC Under Review</h3>
                      <p className="text-slate-300">Your documents are being reviewed by our admin team. You'll be notified once the review is complete.</p>
                    </div>
                  )}

                  {profile.kycStatus === 'approved' && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">KYC Verified</h3>
                      <p className="text-slate-300">Your identity has been verified successfully!</p>
                    </div>
                  )}

                  {profile.kycStatus === 'rejected' && (
                    <div className="text-center py-8">
                      <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">KYC Rejected</h3>
                      <p className="text-slate-300 mb-4">Your KYC verification was rejected. Please resubmit with correct documents.</p>
                      <button
                        onClick={() => setProfile(prev => ({ ...prev, kycStatus: 'not-submitted' }))}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                      >
                        Resubmit Documents
                      </button>
                    </div>
                  )}
                </>
              )}

              {settingsTab === 'security' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-6">Security Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                      <input
                        type="password"
                        placeholder="Enter current password"
                        className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/70 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                      <input
                        type="password"
                        placeholder="Enter new password"
                        className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/70 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/70 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                      Update Password
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
