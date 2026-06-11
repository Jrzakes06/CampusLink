import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PostCard } from './components/PostCard';
import { CreatePostModal } from './components/CreatePostModal';
import { MarketplaceNew } from './components/MarketplaceNew';
import { CreateProductModal } from './components/CreateProductModal';
import { ProductDetailsNew } from './components/ProductDetailsNew';
import { SellerProfileCard } from './components/SellerProfileCard';
import { Jobs } from './components/Jobs';
import { CreateJobModal } from './components/CreateJobModal';
import { JobDetails } from './components/JobDetails';
import { ProfileNew } from './components/ProfileNew';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Messenger } from './components/Messenger';
import { MessengerInbox } from './components/MessengerInbox';
import { Links } from './components/Links';
import { UserProfile } from './components/UserProfile';
import { PlusSquare, Bell, CalendarDays, Home as HomeIcon, MessageSquare, Search, Shield, ShoppingBag, Sparkles, Users } from 'lucide-react';
import { API_BASE, apiHeaders, apiJsonHeaders } from '../../utils/api';
import { usePolling } from '../../utils/usePolling';

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
  createdAt?: number;
  media?: Array<{type: 'image' | 'video' | 'file'; url: string; name?: string}>;
}

interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  images?: string[];
  description: string;
  seller: string;
  sellerAvatar: string;
  category?: string;
  condition?: string;
  createdAt: number;
}

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: 'remote' | 'hybrid' | 'onsite';
  salary: string;
  description: string;
  requirements: string[];
  poster: string;
  posterAvatar: string;
  createdAt: number;
  applications: number;
}

interface UserSession {
  username: string;
  email: string;
  avatar: string;
  isAdmin: boolean;
  kycStatus: string;
}

type View = 'feed' | 'campus-feed' | 'marketplace' | 'product-details' | 'jobs' | 'job-details' | 'profile' | 'admin' | 'messenger' | 'messenger-inbox' | 'seller-profile' | 'links' | 'user-profile';
type AuthView = 'login' | 'signup';

export default function App() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [currentView, setCurrentView] = useState<View>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [messengerData, setMessengerData] = useState<{
    seller: string;
    sellerAvatar: string;
    productTitle: string;
  } | null>(null);
  const [messengerReturnView, setMessengerReturnView] = useState<View>('marketplace');
  const [selectedSellerProfile, setSelectedSellerProfile] = useState<{
    username: string;
    avatar: string;
    fullName?: string;
    university?: string;
    role?: string;
    location?: string;
    kycStatus?: string;
    joinedDate?: number;
  } | null>(null);
  const [followedSellers, setFollowedSellers] = useState<string[]>([]);
  const [linkRequestsCount, setLinkRequestsCount] = useState(0);
  const [viewedUsername, setViewedUsername] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (window.localStorage.getItem('campuslink-theme') as 'dark' | 'light') || 'dark';
  });

  // Fetch posts from server
  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_BASE}/posts`, {
        headers: apiHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(`Error fetching posts from server: ${JSON.stringify(errorData)}`);
        return;
      }

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.log(`Error fetching posts: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize database and admin on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await fetch(`${API_BASE}/init-admin`, {
          method: 'POST',
          headers: apiHeaders(),
        });

        await fetch(`${API_BASE}/init`, {
          method: 'POST',
          headers: apiHeaders(),
        });
      } catch (error) {
        console.log(`Error initializing: ${error}`);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('campuslink-theme', theme);
    }
  }, [theme]);

  // Fetch link requests count
  const fetchLinkRequests = async () => {
    if (!userSession?.username) return;

    try {
      const response = await fetch(
        `${API_BASE}/links/requests/${userSession.username}`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLinkRequestsCount(data.requests?.length || 0);
      }
    } catch (error) {
      console.log(`Error fetching link requests: ${error}`);
    }
  };

  // Refresh user profile from backend
  const refreshUserProfile = async () => {
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
          setUserSession({
            ...userSession,
            avatar: data.user.avatar || userSession.avatar,
            username: data.user.username || userSession.username,
            kycStatus: data.user.kycStatus || userSession.kycStatus,
          });
        }
      }
    } catch (error) {
      console.log(`Error refreshing user profile: ${error}`);
    }
  };

  // Fetch posts when user is logged in
  useEffect(() => {
    if (userSession) {
      fetchPosts();
      fetchLinkRequests();
    }
  }, [userSession?.username]);

  usePolling(
    () => {
      fetchPosts();
      fetchLinkRequests();
    },
    60_000,
    Boolean(userSession),
  );

  const handleLike = async (postId: string) => {
    // Optimistic update
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));

    // Update server
    try {
      const response = await fetch(`${API_BASE}/posts/${postId}/like`, {
        method: 'POST',
        headers: apiJsonHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(`Error liking post: ${JSON.stringify(errorData)}`);
        // Revert optimistic update on error
        fetchPosts();
      }
    } catch (error) {
      console.log(`Error liking post: ${error}`);
      // Revert optimistic update on error
      fetchPosts();
    }
  };

  const handleCreatePost = async (caption: string, media: Array<{type: 'image' | 'video' | 'file'; url: string; name?: string}>) => {
    try {
      const response = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: apiJsonHeaders(),
        body: JSON.stringify({
          username: userSession?.username || 'you',
          userAvatar: userSession?.avatar || '',
          imageUrl: media.length > 0 ? media[0].url : '',
          caption,
          media,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(`Error creating post: ${JSON.stringify(errorData)}`);
        return;
      }

      await fetchPosts();
    } catch (error) {
      console.log(`Error creating post: ${error}`);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      console.log('Deleting post:', postId);
      const response = await fetch(`${API_BASE}/posts/${postId}`, {
        method: 'DELETE',
        headers: apiHeaders(),
      });

      console.log('Delete response status:', response.status);
      const data = await response.json();
      console.log('Delete response:', data);

      if (response.ok) {
        // Immediately remove from local state for instant UI update
        setPosts(posts.filter(p => p.id !== postId));
        // Then fetch fresh data from server
        await fetchPosts();
      } else {
        console.log(`Error deleting post: ${JSON.stringify(data)}`);
        alert('Failed to delete post. Please try again.');
      }
    } catch (error) {
      console.log(`Error deleting post: ${error}`);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleReportUser = async (reportedUser: string, postId: string) => {
    const reason = prompt('Please provide a reason for reporting this user:');
    if (!reason) return;

    try {
      const response = await fetch(`${API_BASE}/reports/create`, {
        method: 'POST',
        headers: apiJsonHeaders(),
        body: JSON.stringify({
          reportedUser,
          reportedBy: userSession?.username || 'anonymous',
          postId,
          reason,
        }),
      });

      if (response.ok) {
        alert('Report submitted successfully. Admin will review it soon.');
      } else {
        alert('Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.log(`Error reporting user: ${error}`);
      alert('Failed to submit report. Please try again.');
    }
  };

  const handleKYCStatusUpdate = (newStatus: string) => {
    if (userSession) {
      setUserSession({
        ...userSession,
        kycStatus: newStatus,
      });
    }
  };

  const handleSellerProfileClick = (sellerUsername: string) => {
    setViewedUsername(sellerUsername);
    setCurrentView('user-profile');
  };

  const handleFollowSeller = async (sellerUsername: string) => {
    try {
      const response = await fetch(`${API_BASE}/seller/follow`, {
        method: 'POST',
        headers: apiJsonHeaders(),
        body: JSON.stringify({
          username: sellerUsername,
          followerUsername: userSession?.username || 'you',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isFollowing) {
          setFollowedSellers([...followedSellers, sellerUsername]);
        } else {
          setFollowedSellers(followedSellers.filter(s => s !== sellerUsername));
        }
      }
    } catch (error) {
      console.log(`Error following seller: ${error}`);
    }
  };

  const handleMessageSeller = (sellerUsername: string) => {
    const seller = selectedSellerProfile || {
      username: sellerUsername,
      avatar: '',
    };

    setMessengerReturnView(currentView);
    setMessengerData({
      seller: seller.username,
      sellerAvatar: seller.avatar,
      productTitle: selectedProduct?.title || 'Product Inquiry',
    });
    setCurrentView('messenger');
  };

  const handleCreateProduct = async (title: string, price: number, images: string[], description: string, category: string, condition: string) => {
    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: apiJsonHeaders(),
        body: JSON.stringify({
          title,
          price,
          imageUrl: images[0],
          images,
          description,
          category,
          condition,
          seller: userSession?.username || 'you',
          sellerAvatar: userSession?.avatar || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(`Error creating product: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.log(`Error creating product: ${error}`);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product-details');
  };

  const handleMessage = (seller: string, sellerAvatar: string, productTitle: string) => {
    setMessengerReturnView(currentView);
    setMessengerData({ seller, sellerAvatar, productTitle });
    setCurrentView('messenger');
  };

  const handleCreateJob = async (
    title: string,
    company: string,
    companyLogo: string,
    location: string,
    type: 'remote' | 'hybrid' | 'onsite',
    salary: string,
    description: string,
    requirements: string[]
  ) => {
    try {
      const response = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: apiJsonHeaders(),
        body: JSON.stringify({
          title,
          company,
          companyLogo,
          location,
          type,
          salary,
          description,
          requirements,
          poster: userSession?.username || 'you',
          posterAvatar: userSession?.avatar || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(`Error creating job: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.log(`Error creating job: ${error}`);
    }
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setCurrentView('job-details');
  };

  const handleApplyToJob = async (jobId: string, coverLetter: string, resumeUrl: string) => {
    try {
      const response = await fetch(`${API_BASE}/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: apiJsonHeaders(),
        body: JSON.stringify({
          applicant: userSession?.username || 'you',
          coverLetter,
          resumeUrl,
        }),
      });

      if (response.ok) {
        alert('Application submitted successfully!');
      } else {
        const errorData = await response.json();
        console.log(`Error applying to job: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.log(`Error applying to job: ${error}`);
    }
  };

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting login with:', email);
      console.log('📡 API endpoint:', `${API_BASE}/auth/login`);

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: apiJsonHeaders(),
        body: JSON.stringify({ email, password }),
      });

      console.log('📥 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Login successful:', data);
        setUserSession(data.session);
        return true;
      } else {
        const errorData = await response.json();
        console.log('❌ Login failed:', errorData);
        return false;
      }
    } catch (error) {
      console.log('❌ Network error during login:', error);
      return false;
    }
  };

  const handleSignup = async (data: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    role: string;
    university: string;
    studentIdFile?: File;
  }): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: apiJsonHeaders(),
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const responseData = await response.json();
        setUserSession(responseData.session);
        return true;
      }
      return false;
    } catch (error) {
      console.log('❌ Network error during signup:', error);
      return false;
    }
  };

  const handleLogout = () => {
    setUserSession(null);
    setCurrentView('feed');
  };

  const handleViewChange = (view: 'feed' | 'campus-feed' | 'marketplace' | 'jobs' | 'profile' | 'admin' | 'messenger' | 'links') => {
    setIsSidebarOpen(false);
    if (view === 'messenger') {
      setCurrentView('messenger-inbox');
    } else {
      setCurrentView(view);
    }
    setSelectedProduct(null);
    setSelectedJob(null);
    setMessengerData(null);
  };

  const normalizedView = currentView === 'messenger-inbox' ? 'messenger' : currentView;

  const sidebarItems = [
    { label: 'Campus', icon: Sparkles, view: 'campus-feed' as const },
    { label: 'Marketplace', icon: ShoppingBag, view: 'marketplace' as const },
    { label: 'Jobs', icon: CalendarDays, view: 'jobs' as const },
    { label: 'Messages', icon: MessageSquare, view: 'messenger' as const },
    { label: 'My Profile', icon: Users, view: 'profile' as const },
  ] as const;

  const mobileNavItems = [
    { label: 'Campus', icon: Sparkles, view: 'campus-feed' as const },
    { label: 'Marketplace', icon: ShoppingBag, view: 'marketplace' as const },
    { label: 'Jobs', icon: CalendarDays, view: 'jobs' as const },
    { label: 'Messages', icon: MessageSquare, view: 'messenger' as const },
    { label: 'Profile', icon: Users, view: 'profile' as const },
  ] as const;

  // Show login/signup if not authenticated
  if (!userSession) {
    if (authView === 'login') {
      return <Login onLogin={handleLogin} onSwitchToSignup={() => setAuthView('signup')} />;
    } else {
      return <Signup onSignup={handleSignup} onSwitchToLogin={() => setAuthView('login')} />;
    }
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(180deg,#020617_0%,#081032_45%,#0f183b_100%)] text-slate-100' : 'bg-slate-100 text-slate-950'}`}>
      <Header
        onMenuToggle={() => setIsSidebarOpen(true)}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        theme={theme}
        onLogout={handleLogout}
        userAvatar={userSession?.avatar}
        notificationCount={linkRequestsCount}
      />

      <div className="lg:pl-72">
        <aside className="hidden lg:flex lg:w-72 flex-col gap-6 fixed left-0 top-16 bottom-0 overflow-y-auto border-r border-slate-700/70 bg-slate-950/95 px-4 py-6">
          <nav className="rounded-[2rem] border border-slate-700/70 bg-slate-950/85 p-4 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)]">
            <div className="mb-4 text-slate-400 text-sm uppercase tracking-[0.2em]">Navigation</div>
            <div className="space-y-2">
              {sidebarItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleViewChange(item.view)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${normalizedView === item.view ? 'border border-blue-400/40 bg-blue-500/10 text-blue-200' : 'border border-transparent bg-slate-900/80 text-slate-300 hover:border-slate-500/70 hover:bg-slate-900/95'}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              {userSession?.isAdmin && (
                <button
                  onClick={() => handleViewChange('admin')}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${currentView === 'admin' ? 'border border-blue-400/40 bg-blue-500/10 text-blue-200' : 'border border-transparent bg-slate-900/80 text-slate-300 hover:border-slate-500/70 hover:bg-slate-900/95'}`}
                >
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Admin</span>
                </button>
              )}
            </div>
          </nav>
        </aside>

        {(currentView === 'feed' || currentView === 'campus-feed') && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid xl:grid-cols-[minmax(0,1fr)_24rem] gap-6">
            <main className="space-y-6">
              <div className="rounded-[2rem] border border-slate-700/70 bg-slate-950/80 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-100">Campus Feed</h2>
                    <p className="mt-2 text-sm text-slate-400">Campus news, jobs, marketplace offers, and student posts in one place.</p>
                  </div>
                  <button
                    onClick={() => setIsPostModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
                  >
                    <PlusSquare className="w-5 h-5" />
                    Create Post
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="rounded-[2rem] border border-slate-700/70 bg-slate-950/80 p-8 text-center text-slate-300 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)]">
                  Loading posts...
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-[2rem] border border-slate-700/70 bg-slate-950/80 p-8 text-center text-slate-300 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)]">
                  <p className="mb-4">No posts yet — be the first to share your campus update.</p>
                  <button
                    onClick={() => setIsPostModalOpen(true)}
                    className="rounded-2xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
                  >
                    Create Post
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      isAdmin={userSession?.isAdmin}
                      onDelete={handleDeletePost}
                      onReport={handleReportUser}
                      onProfileClick={(username) => {
                        if (username === userSession?.username) {
                          setCurrentView('profile');
                        } else {
                          setViewedUsername(username);
                          setCurrentView('user-profile');
                        }
                      }}
                      currentUsername={userSession?.username}
                    />
                  ))}
                </div>
              )}
            </main>

            <aside className="hidden xl:flex flex-col gap-6">
              <div className="rounded-[2rem] border border-slate-700/70 bg-slate-950/80 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)]">
                <div className="flex items-center justify-between text-slate-300 text-sm">
                  <span>Today note</span>
                  <button className="rounded-full bg-slate-900/90 p-2 text-slate-200 hover:text-white transition"><Bell className="h-4 w-4" /></button>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-200">Going to the company and planning meetings for the week ahead.</p>
                <div className="mt-4 flex items-center justify-between rounded-3xl bg-slate-900/90 px-4 py-3 text-sm text-slate-200">
                  <span>20 min ago</span>
                  <span className="rounded-full bg-blue-500/15 px-3 py-1 text-blue-200">I’m going</span>
                </div>
              </div>
              <div className="rounded-[2rem] border border-slate-700/70 bg-slate-950/80 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)]">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">My files</h3>
                <div className="mt-5 rounded-3xl bg-slate-900/90 p-5 text-slate-200">
                  <p className="text-sm">You have not added a file yet.</p>
                  <div className="mt-6 flex flex-wrap gap-2 text-slate-400 text-xs">
                    <span className="rounded-full bg-slate-800/80 px-3 py-1">Word</span>
                    <span className="rounded-full bg-slate-800/80 px-3 py-1">Design</span>
                    <span className="rounded-full bg-slate-800/80 px-3 py-1">Notion</span>
                    <span className="rounded-full bg-slate-800/80 px-3 py-1">Photoshop</span>
                  </div>
                </div>
                <button className="mt-5 w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400">Add file</button>
              </div>
              <div className="rounded-[2rem] border border-slate-700/70 bg-slate-950/80 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)]">
                <div className="flex items-center justify-between text-slate-400 text-sm">
                  <span>Activity</span>
                  <button className="rounded-full bg-slate-900/90 p-2 text-slate-300 hover:text-white transition"><Search className="h-4 w-4" /></button>
                </div>
                <div className="mt-4 text-3xl font-semibold text-slate-100">80%</div>
                <p className="mt-3 text-sm text-slate-400">13 Tasks completed</p>
                <div className="mt-5 h-2 rounded-full bg-slate-800">
                  <div className="h-2 w-4/5 rounded-full bg-blue-500"></div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-slate-400 text-xs">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                </div>
              </div>
            </aside>
          </div>
          <CreatePostModal
            isOpen={isPostModalOpen}
            onClose={() => setIsPostModalOpen(false)}
            onSubmit={handleCreatePost}
            isVerified={userSession?.kycStatus === 'approved'}
          />
        </div>
      )}

      {currentView === 'marketplace' && (
        <>
          <MarketplaceNew
            onCreateProduct={() => setIsProductModalOpen(true)}
            onProductClick={handleProductClick}
            currentUsername={userSession?.username}
            isAdmin={userSession?.isAdmin}
            onDeleteProduct={async (productId) => {
              try {
                const response = await fetch(`${API_BASE}/products/${productId}`, {
                  method: 'DELETE',
                  headers: apiHeaders(),
                });
                if (!response.ok) {
                  alert('Failed to delete product');
                }
              } catch (error) {
                console.log(`Error deleting product: ${error}`);
                alert('Failed to delete product');
              }
            }}
            onSellerClick={(seller) => {
              if (seller === userSession?.username) {
                setCurrentView('profile');
              } else {
                setViewedUsername(seller);
                setCurrentView('user-profile');
              }
            }}
          />
          <CreateProductModal
            isOpen={isProductModalOpen}
            onClose={() => setIsProductModalOpen(false)}
            onSubmit={handleCreateProduct}
            isVerified={userSession?.kycStatus === 'approved'}
          />
        </>
      )}

      {currentView === 'product-details' && selectedProduct && (
        <ProductDetailsNew
          product={selectedProduct}
          onBack={() => setCurrentView('marketplace')}
          onMessage={handleMessage}
          onSellerClick={handleSellerProfileClick}
          onSelectProduct={handleProductClick}
        />
      )}

      {currentView === 'seller-profile' && selectedSellerProfile && (
        <SellerProfileCard
          isOpen={true}
          onClose={() => {
            setCurrentView('product-details');
            setSelectedSellerProfile(null);
          }}
          seller={selectedSellerProfile}
          onFollow={handleFollowSeller}
          onMessage={handleMessageSeller}
          isFollowing={followedSellers.includes(selectedSellerProfile.username)}
        />
      )}

      {currentView === 'jobs' && (
        <>
          <Jobs
            onCreateJob={() => setIsJobModalOpen(true)}
            onJobClick={handleJobClick}
          />
          <CreateJobModal
            isOpen={isJobModalOpen}
            onClose={() => setIsJobModalOpen(false)}
            onSubmit={handleCreateJob}
            isVerified={userSession?.kycStatus === 'approved'}
          />
        </>
      )}

      {currentView === 'job-details' && selectedJob && (
        <JobDetails
          job={selectedJob}
          onBack={() => setCurrentView('jobs')}
          onApply={handleApplyToJob}
        />
      )}

      {currentView === 'profile' && (
        <ProfileNew
          userSession={userSession}
          onKYCStatusUpdate={handleKYCStatusUpdate}
          onProfileUpdate={async (updates) => {
            if (userSession) {
              // Update local state immediately
              setUserSession({
                ...userSession,
                avatar: updates.avatar || userSession.avatar,
                username: updates.username || userSession.username,
              });
              // Refresh from backend to ensure persistence
              await refreshUserProfile();
            }
          }}
        />
      )}

      {currentView === 'links' && <Links username={userSession?.username || ''} />}

      {currentView === 'user-profile' && viewedUsername && (
        <UserProfile
          username={viewedUsername}
          currentUsername={userSession?.username || ''}
          onBack={() => setCurrentView('feed')}
          onMessage={(username) => {
            setMessengerReturnView('user-profile');
            setMessengerData({
              seller: username,
              sellerAvatar: '',
              productTitle: 'Message',
            });
            setCurrentView('messenger');
          }}
        />
      )}

      {currentView === 'admin' && userSession?.isAdmin && <AdminDashboard />}

      {currentView === 'messenger-inbox' && (
        <MessengerInbox username={userSession.username} isAdmin={userSession.isAdmin} />
      )}

      {currentView === 'messenger' && messengerData && (
        <Messenger
          seller={messengerData.seller}
          sellerAvatar={messengerData.sellerAvatar}
          productTitle={messengerData.productTitle}
          currentUsername={userSession.username}
          onBack={() => setCurrentView(messengerReturnView)}
        />
      )}
      </div>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <aside className={`fixed top-16 bottom-0 left-0 z-50 w-72 overflow-y-auto bg-slate-950/95 p-6 shadow-2xl transition-transform duration-300 lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">CampusLink</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-100">Navigation</h2>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="rounded-2xl bg-slate-900/80 px-3 py-2 text-sm text-slate-100">Close</button>
        </div>
        <nav className="mt-6 space-y-2">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => handleViewChange(item.view)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${normalizedView === item.view ? 'bg-blue-500/10 text-blue-200' : 'bg-slate-900/80 text-slate-300 hover:bg-slate-900/95'}`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
          {userSession?.isAdmin && (
            <button
              onClick={() => handleViewChange('admin')}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${currentView === 'admin' ? 'bg-blue-500/10 text-blue-200' : 'bg-slate-900/80 text-slate-300 hover:bg-slate-900/95'}`}
            >
              <Shield className="h-5 w-5" />
              <span className="font-medium">Admin</span>
            </button>
          )}
        </nav>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden border-t border-slate-700/70 bg-slate-950/95 backdrop-blur-xl px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          {mobileNavItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => handleViewChange(item.view)}
                className={`flex flex-col items-center gap-1 rounded-3xl px-3 py-2 text-xs transition ${normalizedView === item.view ? 'text-blue-200' : 'text-slate-400 hover:text-slate-100'}`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}