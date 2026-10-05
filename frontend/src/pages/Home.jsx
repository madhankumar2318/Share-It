import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useLocationFilter } from '../context/LocationContext';
import { Search, Tag, MapPin, Eye, Sparkles, Navigation, X, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Electronics',
  'Tools & DIY',
  'Outdoors & Camping',
  'Home & Kitchen',
  'Books & Study',
  'Sports & Fitness',
  'Party & Games',
];

const Home = () => {
  const { selectedLocation, setIsModalOpen, clearLocation, detectLocation, detectingLocation } = useLocationFilter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      if (selectedLocation && selectedLocation.type !== 'ALL' && selectedLocation.value) {
        params.location = selectedLocation.value;
      }
      const response = await api.get('/items', { params });
      setItems(response.data);
    } catch (err) {
      console.error('Failed to load items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory, selectedLocation]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
            Available
          </span>
        );
      case 'BORROWED':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
            Currently Borrowed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-8 sm:p-12 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community-Powered Sharing</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Borrow what you need. <br />
            Lend what you don't.
          </h1>
          <p className="text-emerald-100 text-base sm:text-lg">
            Stop buying items you'll only use once. Explore cameras, power tools, camping gear, and more right in your neighborhood.
          </p>
        </div>
      </div>

      {/* Search & Categories Bar */}
      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cameras, tents, drill, monitor, textbooks..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-2xl shadow-sm transition text-sm flex items-center gap-2"
          >
            Search
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Location Status Bar */}
        {selectedLocation?.type !== 'ALL' ? (
          <div className="flex items-center justify-between p-3 px-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>
                Showing items near <strong className="font-bold underline decoration-emerald-500 underline-offset-2">{selectedLocation.label}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Change
              </button>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <button
                type="button"
                onClick={clearLocation}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Show All
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 px-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Showing items across all locations in India.</span>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              📍 Filter by my neighborhood
            </button>
          </div>
        )}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-2xl p-4 space-y-4 border border-gray-100 dark:border-slate-800">
              <div className="bg-gray-200 dark:bg-slate-800 h-44 rounded-xl"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        selectedLocation?.type !== 'ALL' ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-300 dark:border-slate-800 p-6">
            <MapPin className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              No items listed in {selectedLocation.label}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
              Nobody has shared an item in your area yet. Be the first neighbor to list something or browse nationwide items!
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/add-item"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
              >
                List an Item Here
              </Link>
              <button
                type="button"
                onClick={clearLocation}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition"
              >
                View Nationwide Items
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-300 dark:border-slate-800">
            <Tag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">No items found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Be the first person to list an item in this category!
            </p>
            <Link
              to="/add-item"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition"
            >
              List an Item Now
            </Link>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-lg dark:hover:shadow-slate-900/40 transition-all duration-200 flex flex-col"
            >
              <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src={
                    item.imageUrl ||
                    'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=60'
                  }
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  onError={(e) => {
                    e.target.src =
                      'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=60';
                  }}
                />
                <div className="absolute top-3 right-3">{getStatusBadge(item.status)}</div>
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-lg text-xs font-medium">
                  {item.category}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 transition line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                    {item.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{item.location || 'Local Community'}</span>
                  </div>
                  <Link
                    to={`/items/${item.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
