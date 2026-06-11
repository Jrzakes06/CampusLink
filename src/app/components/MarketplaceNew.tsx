import { Plus, ChevronLeft, ChevronRight, Star, TrendingUp, Trash2 } from 'lucide-react';
import { Avatar } from './Avatar';
import { useState, useEffect } from 'react';
import { API_BASE, apiHeaders, apiJsonHeaders } from '../../../utils/api';
import { usePolling } from '../../../utils/usePolling';

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

interface MarketplaceNewProps {
  onCreateProduct: () => void;
  onProductClick: (product: Product) => void;
  currentUsername?: string;
  isAdmin?: boolean;
  onDeleteProduct?: (productId: string) => void;
  onSellerClick?: (seller: string) => void;
}

export function MarketplaceNew({ onCreateProduct, onProductClick, currentUsername, isAdmin, onDeleteProduct, onSellerClick }: MarketplaceNewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const fetchProducts = async () => {
    try {
      const [productsRes, topRes] = await Promise.all([
        fetch(`${API_BASE}/products`, {
          headers: apiHeaders(),
        }),
        fetch(`${API_BASE}/products/top-rated`, {
          headers: apiHeaders(),
        }),
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }

      if (topRes.ok) {
        const data = await topRes.json();
        setTopProducts(data.products || []);
      }
    } catch (error) {
      console.log(`Error fetching products: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  usePolling(fetchProducts, 60_000);

  // Auto-play carousel
  useEffect(() => {
    if (topProducts.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % topProducts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [topProducts.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % topProducts.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + topProducts.length) % topProducts.length);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Marketplace</h2>
          <p className="text-sm text-gray-600">Discover amazing deals from fellow students</p>
        </div>
        <button
          onClick={onCreateProduct}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Sell Item
        </button>
      </div>

      {/* Hero Carousel - Top Products */}
      {topProducts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h3 className="text-xl font-bold">Top Selling Products</h3>
          </div>

          <div className="relative bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl overflow-hidden border border-gray-200">
            <div className="relative h-96">
              {topProducts.map((product, idx) => (
                <div
                  key={product.id}
                  onClick={() => onProductClick(product)}
                  className={`absolute inset-0 transition-all duration-500 ease-in-out cursor-pointer ${
                    idx === currentSlide
                      ? 'opacity-100 translate-x-0'
                      : idx < currentSlide
                      ? 'opacity-0 -translate-x-full'
                      : 'opacity-0 translate-x-full'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full p-8">
                    {/* Product Image */}
                    <div className="flex items-center justify-center">
                      <div className="relative w-full h-full max-h-80 bg-white rounded-xl overflow-hidden shadow-lg">
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-col justify-center">
                      <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold mb-4 w-fit">
                        <Star className="w-4 h-4 fill-orange-500" />
                        Featured Product
                      </div>
                      <h3 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">{product.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">{product.description}</p>
                      <div className="flex items-baseline gap-3 mb-6">
                        <span className="text-4xl font-bold text-blue-600">${product.price}</span>
                        {product.condition && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                            {product.condition}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSellerClick?.(product.seller);
                        }}
                        className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 -ml-2 transition-colors"
                      >
                        <Avatar
                          src={product.sellerAvatar}
                          username={product.seller}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Sold by</p>
                          <p className="text-sm text-gray-600">@{product.seller}</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Navigation Arrows */}
              {topProducts.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all z-10"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all z-10"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-800" />
                  </button>

                  {/* Dots Indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {topProducts.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`transition-all ${
                          idx === currentSlide
                            ? 'w-8 h-2 bg-blue-600'
                            : 'w-2 h-2 bg-gray-400 hover:bg-gray-600'
                        } rounded-full`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Products Grid */}
      <div className="mb-4">
        <h3 className="text-xl font-bold">All Products</h3>
        <p className="text-sm text-gray-600">Browse all available items</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No items listed yet. Be the first to sell!</p>
          <button
            onClick={onCreateProduct}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            List an Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
            >
              {(isAdmin || currentUsername === product.seller) && onDeleteProduct && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete "${product.title}"?`)) {
                      onDeleteProduct(product.id);
                    }
                  }}
                  className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div
                onClick={() => onProductClick(product)}
                className="cursor-pointer"
              >
                <div className="aspect-square bg-gray-100">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">{product.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">${product.price}</span>
                    {product.condition && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {product.condition}
                    </span>
                  )}
                </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSellerClick?.(product.seller);
                    }}
                    className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 hover:bg-gray-50 rounded p-1 -m-1 transition-colors w-full"
                  >
                    <Avatar
                      src={product.sellerAvatar}
                      username={product.seller}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-xs text-gray-600">@{product.seller}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
