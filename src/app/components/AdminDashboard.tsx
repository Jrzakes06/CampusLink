import { Users, CheckCircle, Clock, ShoppingBag, Briefcase, FileText, MessageSquare, LayoutDashboard, UserCheck, Trash2, Shield, Heart, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { KYCDocumentViewer } from './KYCDocumentViewer';
import { Avatar } from './Avatar';
import { API_BASE, apiHeaders, apiJsonHeaders } from '../../../utils/api';
import { usePolling } from '../../../utils/usePolling';

interface UserData {
  username: string;
  email: string;
  avatar: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not-submitted';
  kycDocument?: string;
  kycFiles?: {
    selfie?: string;
    studentIdFront?: string;
    nationalIdFront?: string;
    nationalIdBack?: string;
    businessCert?: string;
    companyLogo?: string;
  };
  kycSubmittedAt?: number;
  kycVerification?: {
    decision: string;
    confidence: number;
    reasons: string[];
    provider: string;
  } | null;
  createdAt: number;
  isAdmin?: boolean;
  isBanned?: boolean;
}

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  pendingKYC: number;
  totalPosts: number;
  totalProducts: number;
  totalJobs: number;
  newMessages: number;
}

interface Post {
  id: string;
  username: string;
  userAvatar: string;
  caption: string;
  media?: Array<{type: string; url: string}>;
  likes: number;
  createdAt: number;
}

interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  seller: string;
  sellerAvatar: string;
  description: string;
  createdAt: number;
}

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: string;
  salary: string;
  poster: string;
  posterAvatar: string;
  description: string;
  createdAt: number;
}

interface Report {
  id: string;
  reportedUser: string;
  reportedBy: string;
  postId: string;
  reason: string;
  createdAt: number;
}

type AdminTab = 'dashboard' | 'users' | 'products' | 'jobs' | 'posts' | 'reports';

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingKYC: 0,
    totalPosts: 0,
    totalProducts: 0,
    totalJobs: 0,
    newMessages: 0,
  });
  const [pendingUsers, setPendingUsers] = useState<UserData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [selectedKYCUser, setSelectedKYCUser] = useState<UserData | null>(null);
  const [isKYCViewerOpen, setIsKYCViewerOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [isAiVerifying, setIsAiVerifying] = useState(false);

  const fetchAdminData = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/admin/stats`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
        setPendingUsers(data.pendingUsers || []);
      }
    } catch (error) {
      console.log(`Error fetching admin data: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/admin/users`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || []);
      }
    } catch (error) {
      console.log(`Error fetching users: ${error}`);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/posts`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.log(`Error fetching posts: ${error}`);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/products`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.log(`Error fetching products: ${error}`);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/jobs`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.log(`Error fetching jobs: ${error}`);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/admin/reports`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.log(`Error fetching reports: ${error}`);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(
        `${API_BASE}/posts/${postId}`,
        {
          method: 'DELETE',
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        await fetchPosts();
        await fetchAdminData();
      }
    } catch (error) {
      console.log(`Error deleting post: ${error}`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(
        `${API_BASE}/products/${productId}`,
        {
          method: 'DELETE',
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        await fetchProducts();
        await fetchAdminData();
      }
    } catch (error) {
      console.log(`Error deleting product: ${error}`);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const response = await fetch(
        `${API_BASE}/jobs/${jobId}`,
        {
          method: 'DELETE',
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        await fetchJobs();
        await fetchAdminData();
      }
    } catch (error) {
      console.log(`Error deleting job: ${error}`);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to dismiss this report?')) return;

    try {
      const response = await fetch(
        `${API_BASE}/admin/reports/${reportId}`,
        {
          method: 'DELETE',
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        await fetchReports();
      }
    } catch (error) {
      console.log(`Error deleting report: ${error}`);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Are you sure you want to delete user ${username}? This action cannot be undone.`)) return;

    try {
      const response = await fetch(
        `${API_BASE}/admin/users/${username}`,
        {
          method: 'DELETE',
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        await fetchAllUsers();
        await fetchAdminData();
      }
    } catch (error) {
      console.log(`Error deleting user: ${error}`);
    }
  };

  const handleBanUser = async (username: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/admin/users/${username}/ban`,
        {
          method: 'POST',
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        await fetchAllUsers();
      }
    } catch (error) {
      console.log(`Error banning user: ${error}`);
    }
  };

  const handleUnverifyUser = async (username: string) => {
    if (!confirm(`Remove verification status from ${username}?`)) return;

    try {
      const response = await fetch(
        `${API_BASE}/admin/users/${username}/unverify`,
        {
          method: 'POST',
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        await fetchAllUsers();
        await fetchAdminData();
      }
    } catch (error) {
      console.log(`Error removing verification: ${error}`);
    }
  };

  useEffect(() => {
    fetchAdminData();
    if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'jobs') {
      fetchJobs();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'users') {
      fetchAllUsers();
    }
  }, [activeTab]);

  usePolling(
    () => {
      fetchAdminData();
      if (activeTab === 'posts') {
        fetchPosts();
      } else if (activeTab === 'products') {
        fetchProducts();
      } else if (activeTab === 'jobs') {
        fetchJobs();
      } else if (activeTab === 'reports') {
        fetchReports();
      } else if (activeTab === 'users') {
        fetchAllUsers();
      }
    },
    60_000,
  );

  const openKycReview = async (user: UserData) => {
    try {
      const response = await fetch(`${API_BASE}/kyc/user/${user.username}`, {
        headers: apiHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedKYCUser({ ...user, kycFiles: data.user?.kycFiles });
        setIsKYCViewerOpen(true);
      }
    } catch (error) {
      console.log(`Error loading KYC documents: ${error}`);
    }
  };

  const handleAutoVerifyKYC = async (username?: string) => {
    setIsAiVerifying(true);
    try {
      const response = await fetch(`${API_BASE}/admin/kyc/auto-verify`, {
        method: 'POST',
        headers: apiJsonHeaders(),
        body: JSON.stringify(username ? { username } : {}),
      });
      if (response.ok) {
        await fetchAdminData();
        if (activeTab === 'users') await fetchAllUsers();
      }
    } catch (error) {
      console.log(`Error running AI KYC verify: ${error}`);
    } finally {
      setIsAiVerifying(false);
    }
  };

  const handleKYCAction = async (username: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(
        `${API_BASE}/admin/kyc/${action}`,
        {
          method: 'POST',
          headers: apiJsonHeaders(),
          body: JSON.stringify({ username }),
        }
      );

      if (response.ok) {
        await fetchAdminData();
      }
    } catch (error) {
      console.log(`Error updating KYC status: ${error}`);
    }
  };

  const dashboardTabs: Array<{ tab: Exclude<AdminTab, 'dashboard'>; label: string }> = [
    { tab: 'users', label: 'Users' },
    { tab: 'products', label: 'Products' },
    { tab: 'jobs', label: 'Jobs' },
    { tab: 'posts', label: 'Posts' },
    { tab: 'reports', label: 'Reports' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <div className="text-white text-lg">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Main Feed - Center */}
      <div className="flex-1 border-r border-gray-700 max-h-screen overflow-y-auto pb-20 md:pb-0">
        {/* Header */}
        <div className="sticky top-0 bg-black/80 backdrop-blur border-b border-gray-700 p-4 z-10">
          <h2 className="text-xl font-bold text-white">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h2>
        </div>

        {/* Tab Navigation */}
        <div className="sticky top-[72px] z-10 bg-black/90 border-b border-gray-700 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeTab === 'dashboard' ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-200 hover:bg-white/10'
              }`}
            >
              Dashboard
            </button>
            {dashboardTabs.map(({ tab, label }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  activeTab === tab ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-200 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Feed */}
        <div className="divide-y divide-gray-700">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Cards */}
              <div className="p-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4">
                    <p className="text-gray-500 text-sm font-semibold mb-2">Total Users</p>
                    <p className="text-2xl font-bold text-blue-400">{stats.totalUsers}</p>
                    <p className="text-gray-600 text-xs mt-1">{stats.verifiedUsers} verified</p>
                  </div>
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-4">
                    <p className="text-gray-500 text-sm font-semibold mb-2">Pending KYC</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.pendingKYC}</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-4">
                    <p className="text-gray-500 text-sm font-semibold mb-2">Products</p>
                    <p className="text-2xl font-bold text-green-400">{stats.totalProducts}</p>
                  </div>
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-4">
                    <p className="text-gray-500 text-sm font-semibold mb-2">Jobs</p>
                    <p className="text-2xl font-bold text-purple-400">{stats.totalJobs}</p>
                  </div>
                  <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-2xl p-4">
                    <p className="text-gray-500 text-sm font-semibold mb-2">Posts</p>
                    <p className="text-2xl font-bold text-cyan-400">{stats.totalPosts}</p>
                  </div>
                  <div className="bg-pink-900/20 border border-pink-500/30 rounded-2xl p-4">
                    <p className="text-gray-500 text-sm font-semibold mb-2">Messages</p>
                    <p className="text-2xl font-bold text-pink-400">{stats.newMessages}</p>
                  </div>
                </div>
              </div>

              {/* KYC Reviews */}
              <div className="p-4 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-400" />
                    <h3 className="text-xl font-bold">Pending KYC Reviews</h3>
                  </div>
                  {pendingUsers.length > 0 && (
                    <button
                      onClick={() => handleAutoVerifyKYC()}
                      disabled={isAiVerifying}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-full text-sm font-semibold transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      {isAiVerifying ? 'AI verifying…' : 'AI verify all'}
                    </button>
                  )}
                </div>
                {pendingUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pending KYC requests</p>
                ) : (
                  <div className="space-y-2 mt-4">
                    {pendingUsers.map((user) => (
                      <div key={user.username} className="p-3 bg-gray-900/50 rounded-2xl hover:bg-gray-900 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar src={user.avatar} username={user.username} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <p className="font-bold text-white">{user.username}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            {user.kycVerification && (
                              <p className="text-xs text-violet-300 mt-1">
                                AI: {user.kycVerification.decision} ({Math.round(user.kycVerification.confidence * 100)}%)
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          <button
                            onClick={() => handleAutoVerifyKYC(user.username)}
                            disabled={isAiVerifying}
                            className="px-3 py-1 bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white rounded-full text-sm font-semibold transition-colors"
                          >
                            AI verify
                          </button>
                          <button onClick={() => openKycReview(user)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-full text-sm font-semibold transition-colors">Review</button>
                          <button onClick={() => handleKYCAction(user.username, 'approve')} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm font-semibold transition-colors">Approve</button>
                          <button onClick={() => handleKYCAction(user.username, 'reject')} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-semibold transition-colors">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <>
              {allUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No users found</div>
              ) : (
                allUsers.map((user) => (
                  <div key={user.username} className="p-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-gray-700">
                    <div className="flex gap-4">
                      <Avatar src={user.avatar} username={user.username} className="w-12 h-12 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-white text-lg">{user.username}</p>
                            <p className="text-gray-500">@{user.username}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${user.kycStatus === 'approved' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{user.kycStatus}</span>
                        </div>
                        <p className="text-gray-400 mt-2">{user.email}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {user.kycStatus === 'pending' && (
                            <>
                              <button onClick={() => openKycReview(user)} className="px-4 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-full text-sm font-semibold transition-colors">Review</button>
                              <button onClick={() => handleKYCAction(user.username, 'approve')} className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold transition-colors">Approve</button>
                            </>
                          )}
                          {!user.isBanned && <button onClick={() => handleBanUser(user.username)} className="px-4 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-sm font-semibold transition-colors">Ban</button>}
                          <button onClick={() => handleDeleteUser(user.username)} className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-semibold transition-colors">Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'products' && (
            <>
              {products.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No products found</div>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="p-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-gray-700">
                    <div className="flex gap-4">
                      <img src={product.imageUrl} alt={product.title} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-white text-lg">{product.title}</p>
                            <p className="text-gray-500">by {product.seller}</p>
                          </div>
                          <p className="text-lg font-bold text-green-400">${product.price}</p>
                        </div>
                        <p className="text-gray-400 mt-2 line-clamp-2">{product.description}</p>
                        <button onClick={() => handleDeleteProduct(product.id)} className="mt-3 px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-semibold transition-colors">Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'jobs' && (
            <>
              {jobs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No jobs found</div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="p-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-gray-700">
                    <div className="flex gap-4">
                      <img src={job.companyLogo} alt={job.company} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-white text-lg">{job.title}</p>
                            <p className="text-gray-500">{job.company}</p>
                          </div>
                          <span className="text-blue-400 font-semibold">{job.type}</span>
                        </div>
                        <p className="text-gray-400 mt-2">{job.location} • {job.salary}</p>
                        <p className="text-gray-400 mt-2 line-clamp-2">{job.description}</p>
                        <button onClick={() => handleDeleteJob(job.id)} className="mt-3 px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-semibold transition-colors">Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'posts' && (
            <>
              {posts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No posts found</div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="p-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-gray-700">
                    <div className="flex gap-4">
                      <Avatar src={post.userAvatar} username={post.username} className="w-12 h-12 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-white text-lg">{post.username}</p>
                            <p className="text-gray-500">@{post.username}</p>
                          </div>
                          <button onClick={() => handleDeletePost(post.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-white mt-3">{post.caption}</p>
                        {post.media && post.media.length > 0 && (
                          <div className="mt-3 rounded-2xl overflow-hidden">
                            <img src={post.media[0].url} alt="post" className="w-full max-h-80 object-cover" />
                          </div>
                        )}
                        <div className="flex gap-8 mt-3 text-gray-500 text-sm">
                          <span className="hover:text-red-500 cursor-pointer transition-colors">
                            <Heart className="w-4 h-4 inline mr-2" />
                            {post.likes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'reports' && (
            <>
              {reports.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No reports found</div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="p-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-white">Report: {report.id}</p>
                        <p className="text-gray-500">Reported user: @{report.reportedUser}</p>
                      </div>
                      <button onClick={() => handleDeleteReport(report.id)} className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-semibold transition-colors">Dismiss</button>
                    </div>
                    <p className="text-gray-400 mt-2"><span className="text-red-400 font-semibold">Reason:</span> {report.reason}</p>
                    <p className="text-gray-500 text-sm mt-2">Reported by @{report.reportedBy}</p>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Sidebar - Stats Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col w-80 bg-black border-l border-gray-700 p-4 h-screen overflow-y-auto">
        {/* Search Bar */}
        <div className="bg-gray-900 rounded-full px-4 py-3 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-500" />
          <input type="text" placeholder="Search Admin" className="bg-transparent text-white outline-none flex-1" />
        </div>

        {/* What's happening */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-4">
          <p className="text-xl font-bold text-white mb-4">What's happening!?</p>
          <div className="space-y-4">
            <div className="hover:bg-white/5 transition-colors p-3 rounded-lg cursor-pointer">
              <p className="text-gray-500 text-sm">Trending Worldwide</p>
              <p className="font-bold text-white">#AdminDashboard</p>
              <p className="text-gray-500 text-sm">150K posts</p>
            </div>
            <div className="hover:bg-white/5 transition-colors p-3 rounded-lg cursor-pointer">
              <p className="text-gray-500 text-sm">Trending Worldwide</p>
              <p className="font-bold text-white">#KYCVerification</p>
              <p className="text-gray-500 text-sm">89K posts</p>
            </div>
            <div className="hover:bg-white/5 transition-colors p-3 rounded-lg cursor-pointer">
              <p className="text-gray-500 text-sm">Trending Worldwide</p>
              <p className="font-bold text-white">#CommunityGrowth</p>
              <p className="text-gray-500 text-sm">234K posts</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-gray-500 text-xs space-y-2 mt-4">
          <a href="#" className="hover:text-blue-400 block">About</a>
          <a href="#" className="hover:text-blue-400 block">Help Center</a>
          <a href="#" className="hover:text-blue-400 block">Privacy Policy</a>
          <a href="#" className="hover:text-blue-400 block">Settings</a>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around bg-black border-t border-gray-700 z-50">
        {[
          { tab: 'dashboard' as const, icon: LayoutDashboard, label: 'Dashboard' },
          { tab: 'users' as const, icon: Users, label: 'Users' },
          { tab: 'products' as const, icon: ShoppingBag, label: 'Products' },
          { tab: 'jobs' as const, icon: Briefcase, label: 'Jobs' },
          { tab: 'posts' as const, icon: FileText, label: 'Posts' },
        ].map(({ tab, icon: Icon }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center py-3 transition-colors ${
              activeTab === tab
                ? 'text-blue-400 border-t-2 border-blue-400'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            <Icon className="w-6 h-6" />
          </button>
        ))}
      </div>

      {/* KYC Viewer Modal */}
      {isKYCViewerOpen && selectedKYCUser && (
        <KYCDocumentViewer
          isOpen={isKYCViewerOpen}
          onClose={() => setIsKYCViewerOpen(false)}
          user={selectedKYCUser}
          onApprove={(username) => handleKYCAction(username, 'approve')}
          onReject={(username) => handleKYCAction(username, 'reject')}
        />
      )}
    </div>
  );
}
