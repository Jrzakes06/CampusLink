import { X, MapPin, Star, Users, Package, Award, Calendar, CheckCircle, MessageCircle, UserPlus, UserCheck } from 'lucide-react';
import { Avatar } from './Avatar';
import { useState, useEffect } from 'react';
import { API_BASE, apiHeaders, apiJsonHeaders } from '../../../utils/api';

interface SellerProfileCardProps {
  isOpen: boolean;
  onClose: () => void;
  seller: {
    username: string;
    avatar: string;
    fullName?: string;
    university?: string;
    role?: string;
    location?: string;
    kycStatus?: string;
    joinedDate?: number;
  };
  onFollow?: (username: string) => void;
  onMessage?: (username: string) => void;
  isFollowing?: boolean;
}

export function SellerProfileCard({ isOpen, onClose, seller, onFollow, onMessage, isFollowing }: SellerProfileCardProps) {
  const [stats, setStats] = useState({
    followers: 0,
    products: 0,
    rating: 0,
    reviews: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && seller.username) {
      fetchSellerStats();
    }
  }, [isOpen, seller.username]);

  const fetchSellerStats = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/seller/stats/${seller.username}`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.log(`Error fetching seller stats: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-md w-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Glass card */}
        <div className="relative bg-gradient-to-br from-purple-900/90 via-purple-800/90 to-indigo-900/90 backdrop-blur-xl border-2 border-purple-400/50 rounded-3xl p-8 shadow-2xl">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-3xl blur-xl -z-10"></div>

          {/* LinkedIn icon placeholder */}
          <div className="absolute top-6 left-6 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/20">
            <Package className="w-5 h-5 text-purple-300" />
          </div>

          {/* Content */}
          <div className="text-center mt-8">
            {/* Avatar */}
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-full border-4 border-purple-400/50 overflow-hidden bg-white/10 backdrop-blur-sm">
                <Avatar
                  src={seller.avatar}
                  username={seller.username}
                  className="w-full h-full object-cover"
                />
              </div>
              {seller.kycStatus === 'approved' && (
                <div className="absolute bottom-0 right-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-purple-900">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Name and title */}
            <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">
              {seller.fullName || seller.username}
            </h2>
            <p className="text-purple-300 text-sm mb-4 uppercase tracking-wider">
              {seller.role || 'Seller'}
            </p>

            {/* Location */}
            {seller.location && (
              <div className="flex items-center justify-center gap-2 text-purple-200 mb-6">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{seller.location}</span>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-purple-300" />
                  <span className="text-2xl font-bold text-white">{stats.followers}+</span>
                </div>
                <p className="text-xs text-purple-300 uppercase">Followers</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-purple-300" />
                  <span className="text-2xl font-bold text-white">{stats.products}</span>
                </div>
                <p className="text-xs text-purple-300 uppercase">Products</p>
              </div>
            </div>

            {/* Rating */}
            {stats.rating > 0 && (
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="flex items-center gap-1 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500/30">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-bold">{stats.rating.toFixed(1)}</span>
                  <span className="text-purple-300 text-sm">({stats.reviews} reviews)</span>
                </div>
              </div>
            )}

            {/* Member since */}
            {seller.joinedDate && (
              <div className="flex items-center justify-center gap-2 text-purple-300 text-sm mb-6">
                <Calendar className="w-4 h-4" />
                <span>Member since {Number(seller.joinedDate) > 0 ? new Date(Number(seller.joinedDate)).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              {onFollow && (
                <button
                  onClick={() => onFollow(seller.username)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    isFollowing
                      ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isFollowing ? 'Linked' : 'Link'}
                </button>
              )}
              {onMessage && (
                <button
                  onClick={() => onMessage(seller.username)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* University */}
            {seller.university && (
              <div className="mt-6 text-xs text-purple-400">
                {seller.university}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
