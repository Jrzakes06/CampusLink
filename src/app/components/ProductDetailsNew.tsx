import { ArrowLeft, Star, Heart, Share2, ShieldCheck, Truck, CreditCard, MessageCircle, MapPin, User } from 'lucide-react';
import { Avatar } from './Avatar';
import { useState, useEffect } from 'react';
import { API_BASE, apiHeaders, apiJsonHeaders } from '../../../utils/api';

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
  rating?: number;
  reviews?: number;
  originalPrice?: number;
  discount?: number;
}

interface ProductDetailsNewProps {
  product: Product;
  onBack: () => void;
  onMessage: (seller: string, sellerAvatar: string, productTitle: string) => void;
  onSellerClick?: (seller: string) => void;
  onSelectProduct?: (product: Product) => void;
}

export function ProductDetailsNew({ product, onBack, onMessage, onSellerClick, onSelectProduct }: ProductDetailsNewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const images = product.images && product.images.length > 0 ? product.images : [product.imageUrl];
  const rating = product.rating || 0;
  const reviews = product.reviews || 0;

  useEffect(() => {
    fetchRelatedProducts();
  }, [product.id]);

  const fetchRelatedProducts = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/products`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const filtered = (data.products || [])
          .filter((p: Product) => p.id !== product.id && (p.category === product.category || p.seller === product.seller))
          .slice(0, 4);
        setRelatedProducts(filtered);
      }
    } catch (error) {
      console.log(`Error fetching related products: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-full transition-colors ${
                isFavorite ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/50 text-gray-300 hover:text-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-400' : ''}`} />
            </button>
            <button className="p-2 bg-slate-700/50 rounded-full text-gray-300 hover:text-white transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50 aspect-square">
              <img
                src={images[selectedImageIndex]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-blue-500 scale-105'
                        : 'border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              {product.category && (
                <p className="text-gray-400 text-sm">{product.category}</p>
              )}
            </div>

            {/* Rating */}
            {rating > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-white font-semibold">{Number(rating).toFixed(1)}</span>
                </div>
                <span className="text-gray-400 text-sm">({reviews} Reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-white">${Number(product.price).toFixed(2)}</span>
              {product.condition && (
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full border border-green-500/30">
                  {product.condition}
                </span>
              )}
            </div>

            {/* Contact Seller Button */}
            <button
              onClick={() => onMessage(product.seller, product.sellerAvatar, product.title)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-blue-500/20"
            >
              <MessageCircle className="w-6 h-6" />
              Contact Seller
            </button>

            {/* Seller Info */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-sm text-gray-400 mb-3">Sold by</p>
              <button
                onClick={() => onSellerClick && onSellerClick(product.seller)}
                className="flex items-center gap-3 hover:bg-slate-700/30 rounded-lg p-2 -m-2 transition-colors w-full"
              >
                <Avatar
                  src={product.sellerAvatar}
                  username={product.seller}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/50"
                />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-white">@{product.seller}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>Zimbabwe</span>
                  </div>
                </div>
                <User className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Description */}
            <div className="pt-4 border-t border-slate-700/50">
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{product.description}</p>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6">Related Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProd) => (
                <button
                  key={relProd.id}
                  onClick={() => {
                    if (onSelectProduct) {
                      onSelectProduct(relProd);
                      window.scrollTo(0, 0);
                    }
                  }}
                  className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden hover:bg-slate-800/70 transition-all text-left"
                >
                  <div className="aspect-square bg-slate-700/30">
                    <img
                      src={relProd.imageUrl}
                      alt={relProd.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-white mb-1 line-clamp-1">{relProd.title}</h4>
                    <p className="text-sm text-gray-400 mb-2 line-clamp-2">{relProd.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-400">${relProd.price}</span>
                      {relProd.condition && (
                        <span className="px-2 py-1 bg-slate-700/50 text-gray-300 text-xs rounded-full">
                          {relProd.condition}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
                      <Avatar
                        src={relProd.sellerAvatar}
                        username={relProd.seller}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-xs text-gray-400">@{relProd.seller}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
