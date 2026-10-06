import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useLocationFilter } from '../context/LocationContext';
import { 
  Search, 
  Tag, 
  MapPin, 
  Eye, 
  Sparkles, 
  Navigation, 
  X, 
  LayoutGrid,
  Map as MapIcon,
  Compass,
  LocateFixed,
  Star,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Mic,
} from 'lucide-react';
import NeighborhoodMap from '../components/NeighborhoodMap';
import FavoriteButton from '../components/FavoriteButton';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { calculateDistanceKm, formatDistance, getItemCoordinates } from '../utils/geo';
import { ItemCardSkeleton } from '../components/SkeletonCard';
import VoiceSearchModal from '../components/VoiceSearchModal';

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

const RADIUS_OPTIONS = [
  { label: 'All Distances', value: null },
  { label: '1 km', value: 1 },
  { label: '3 km', value: 3 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
];

const Home = () => {
  const { 
    selectedLocation, 
    userCoords, 
    setIsModalOpen, 
    clearLocation, 
    detectLocation, 
    detectingLocation 
  } = useLocationFilter();

  const { user } = useAuth();
  const { t } = useLanguage();

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'All': return t('all');
      case 'Electronics': return t('electronics');
      case 'Tools & DIY': return t('toolsDIY');
      case 'Outdoors & Camping': return t('outdoorsCamping');
      case 'Home & Kitchen': return t('homeKitchen');
      case 'Books & Study': return t('booksStudy');
      case 'Sports & Fitness': return t('sportsFitness');
      case 'Party & Games': return t('partyGames');
      default: return cat;
    }
  };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  
  // Interactive Map & Distance Slider States
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [distanceRadius, setDistanceRadius] = useState(null); // null = all, or number in km

  // New Features: "Available Today" Filter, Instant Autocomplete & Sort
  const [availableTodayOnly, setAvailableTodayOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'nearest' | 'rating'
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  // Multilingual Voice Search States
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [activeVoiceMapping, setActiveVoiceMapping] = useState(null);

  useEffect(() => {
    const fetchFavoriteIds = async () => {
      if (!user) {
        setFavoriteIds(new Set());
        return;
      }
      try {
        const res = await api.get('/favorites/ids');
        setFavoriteIds(new Set(res.data || []));
      } catch (err) {
        console.warn('Could not load favorite IDs', err);
      }
    };

    fetchFavoriteIds();
  }, [user]);

  const handleFavoriteToggle = (itemId, isNowFav) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isNowFav) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  };

  const fetchItems = async (customQuery = null) => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      const queryToSearch = customQuery !== null ? customQuery : search;
      if (queryToSearch && queryToSearch.trim()) {
        params.search = queryToSearch.trim();
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

  const handleVoiceSearchSubmit = (mappedResult) => {
    setActiveVoiceMapping(mappedResult);
    const query = mappedResult.mappedKeyword || mappedResult.original;
    setSearch(query);
    setIsSearchFocused(false);
    fetchItems(mappedResult.combinedQuery || query);
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory, selectedLocation]);

  // Handle clicking outside autocomplete dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsSearchFocused(false);
    fetchItems();
  };

  // Instant Search Autocomplete Suggestions (top 6 matches)
  const searchSuggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return items
      .filter((item) =>
        item.title?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      )
      .slice(0, 6);
  }, [items, search]);

  // Filter & Sort items pipeline
  const displayItems = useMemo(() => {
    let result = [...items];

    // 1. "Available Today" filter
    if (availableTodayOnly) {
      result = result.filter(
        (item) => item.status === 'AVAILABLE' && !item.isBookedToday
      );
    }

    // 2. Distance radius filter from user coords
    if (distanceRadius && userCoords?.latitude && userCoords?.longitude) {
      result = result.filter((item) => {
        const coords = getItemCoordinates(item);
        if (!coords) return false;
        const dist = calculateDistanceKm(
          userCoords.latitude,
          userCoords.longitude,
          coords.lat,
          coords.lng
        );
        return dist != null && dist <= distanceRadius;
      });
    }

    // 3. Sorting Options
    if (sortBy === 'nearest' && userCoords?.latitude && userCoords?.longitude) {
      result.sort((a, b) => {
        const cA = getItemCoordinates(a);
        const cB = getItemCoordinates(b);
        const dA = cA ? calculateDistanceKm(userCoords.latitude, userCoords.longitude, cA.lat, cA.lng) : 999999;
        const dB = cB ? calculateDistanceKm(userCoords.latitude, userCoords.longitude, cB.lat, cB.lng) : 999999;
        return (dA || 999999) - (dB || 999999);
      });
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else {
      // Newest listings first
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    return result;
  }, [items, availableTodayOnly, distanceRadius, userCoords, sortBy]);

  const handleRadiusClick = async (radiusVal) => {
    setDistanceRadius(radiusVal);
    // If user clicks a specific radius but hasn't enabled GPS coords, auto-prompt detection
    if (radiusVal && (!userCoords?.latitude || !userCoords?.longitude)) {
      await detectLocation();
    }
  };

  const getStatusBadge = (item) => {
    const isAvail = item.status === 'AVAILABLE' && !item.isBookedToday;
    if (isAvail) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Available Today
        </span>
      );
    }
    if (item.status === 'BORROWED' || item.isBookedToday) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
          Booked / In Use
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-300">
        {item.status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 sm:p-12 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('heroTag')}</span>
          </div>
          <h1 className="text-2xl sm:text-5xl font-black tracking-tight leading-tight">
            {t('heroTitle1')} <br />
            {t('heroTitle2')}
          </h1>
          <p className="text-emerald-100 text-sm sm:text-lg">
            {t('heroSubtitle')}
          </p>
        </div>
      </div>

      {/* Search & Instant Autocomplete Dropdown */}
      <div className="space-y-3 sm:space-y-4">
        <div ref={searchContainerRef} className="relative">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5 sm:gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-11 pr-24 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setActiveVoiceMapping(null);
                      fetchItems('');
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition rounded-lg"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchFocused(false);
                    setIsVoiceModalOpen(true);
                  }}
                  className="px-2 py-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-800 rounded-xl transition flex items-center gap-1 text-xs font-bold shadow-2xs"
                  title="Search by Voice (Hindi, Tamil, Telugu, Kannada, Bengali, English...)"
                  aria-label="Search by Voice in Regional Languages"
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">{t('voice')}</span>
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-xs transition text-sm flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4 sm:hidden" />
              <span>{t('search')}</span>
            </button>
          </form>

          {/* 🎙️ Active Voice Query Dialect Mapping Tag */}
          {activeVoiceMapping && (
            <div className="mt-2.5 flex items-center gap-2 p-2.5 px-3.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200">
              <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <span>
                  Voice input: <strong>"{activeVoiceMapping.original}"</strong>
                </span>
                {activeVoiceMapping.matchedTerm && (
                  <span className="ml-1 text-emerald-700 dark:text-emerald-300">
                    &bull; Auto-mapped dialect <strong>"{activeVoiceMapping.matchedTerm}"</strong> ➔ catalog keyword{' '}
                    <strong>"{activeVoiceMapping.mappedKeyword}"</strong>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveVoiceMapping(null);
                  setSearch('');
                  fetchItems('');
                }}
                className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-100 p-1 rounded-lg hover:bg-emerald-100/60 transition"
                title="Clear voice query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ⚡ Instant Search Autocomplete Suggestions Dropdown */}
          {isSearchFocused && search.trim().length >= 1 && (
            <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-[500px] mt-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-gray-100 dark:divide-slate-800">
              <div className="p-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  Instant Matches ({searchSuggestions.length})
                </span>
                <span className="text-[10px] text-gray-400">Press Enter or click to view</span>
              </div>

              {searchSuggestions.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  No matching items found for "{search}".
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {searchSuggestions.map((sug) => {
                    const isAvail = sug.status === 'AVAILABLE' && !sug.isBookedToday;
                    return (
                      <Link
                        key={sug.id}
                        to={`/items/${sug.id}`}
                        onClick={() => setIsSearchFocused(false)}
                        className="flex items-center gap-3 p-3 hover:bg-emerald-50/70 dark:hover:bg-slate-800/70 transition"
                      >
                        <img
                          src={sug.imageUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=60'}
                          alt={sug.title}
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0 bg-slate-100 dark:bg-slate-800"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {sug.title}
                            </h4>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                              isAvail
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            }`}>
                              {isAvail ? '🟢 Available Today' : '🟡 In Use'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{sug.category}</span>
                            <span>&bull;</span>
                            <span className="truncate">{sug.location || 'Local Community'}</span>
                            {sug.averageRating > 0 && (
                              <>
                                <span>&bull;</span>
                                <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                  {sug.averageRating}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category Pills & "Available Today" Filter Chip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {/* 🟢 "Available Today" Quick Filter Chip */}
          <button
            type="button"
            onClick={() => setAvailableTodayOnly(!availableTodayOnly)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border active:scale-95 flex-shrink-0 ${
              availableTodayOnly
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/30'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${availableTodayOnly ? 'bg-white' : 'bg-emerald-500 animate-pulse'}`}></span>
            {t('availableToday')}
            {availableTodayOnly && <CheckCircle2 className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <span className="text-gray-300 dark:text-gray-700 flex-shrink-0">|</span>

          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Location Status Bar */}
        {selectedLocation?.type !== 'ALL' ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 px-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="leading-snug">
                Showing items near <strong className="font-bold underline decoration-emerald-500 underline-offset-2">{selectedLocation.label}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 px-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Showing items across all locations in India.</span>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 self-end sm:self-auto"
            >
              📍 {t('filterNeighborhood')}
            </button>
          </div>
        )}
      </div>

      {/* Interactive Neighborhood Controls: Distance Radius, Sort, and View Mode Toggle */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xs">
        {/* Distance Radius Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mr-1">
            <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Radius:
          </span>
          {RADIUS_OPTIONS.map((r) => {
            const isSelected = distanceRadius === r.value;
            return (
              <button
                key={r.label}
                type="button"
                onClick={() => handleRadiusClick(r.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {r.value === null ? t('allDistances') : r.label}
              </button>
            );
          })}

          {!userCoords?.latitude && distanceRadius && (
            <button
              type="button"
              onClick={detectLocation}
              disabled={detectingLocation}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline ml-1"
            >
              <LocateFixed className="w-3 h-3" />
              {detectingLocation ? 'Detecting GPS...' : 'Turn on GPS'}
            </button>
          )}

          {distanceRadius && userCoords?.latitude && (
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
              ✓ Within {distanceRadius} km ({displayItems.length} found)
            </span>
          )}
        </div>

        {/* Right Controls: Sort Dropdown & View Mode Toggle */}
        <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-slate-800">
          {/* 🔃 Sort Options */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-medium hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="newest">🕒 {t('newestListings')}</option>
              <option value="nearest">📍 Nearest First</option>
              <option value="rating">⭐ Highest Rated</option>
            </select>
          </div>

          {/* View Mode Toggle: Grid View vs Map View */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex-shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {t('grid')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              {t('map')}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area: Map View OR Grid View */}
      {viewMode === 'map' ? (
        <div className="space-y-4">
          <NeighborhoodMap
            items={displayItems}
            userCoords={userCoords}
            distanceRadius={distanceRadius}
            onSelectRadius={handleRadiusClick}
          />

          {displayItems.length === 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 text-center space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                No items match your active filters on the map.
              </p>
              <div className="flex items-center justify-center gap-3 pt-1">
                {availableTodayOnly && (
                  <button
                    type="button"
                    onClick={() => setAvailableTodayOnly(false)}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Turn off "Available Today" &rarr;
                  </button>
                )}
                {distanceRadius && (
                  <button
                    type="button"
                    onClick={() => setDistanceRadius(null)}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Reset distance radius &rarr;
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Items Grid */
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          availableTodayOnly ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-300 dark:border-slate-800 p-6 space-y-3">
              <Clock className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                No items available for pickup today
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                All matching items are currently in use or booked for today. Turn off the "Available Today" filter to reserve an upcoming slot!
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setAvailableTodayOnly(false)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                >
                  View All Dates & Schedule
                </button>
              </div>
            </div>
          ) : distanceRadius ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-300 dark:border-slate-800 p-6 space-y-3">
              <Compass className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                No items within {distanceRadius} km
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                No neighbor items were found within your selected radius. Try expanding your search distance!
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDistanceRadius(10)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                >
                  Try 10 km Radius
                </button>
                <button
                  type="button"
                  onClick={() => setDistanceRadius(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Show All Items
                </button>
              </div>
            </div>
          ) : selectedLocation?.type !== 'ALL' ? (
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
            {displayItems.map((item) => {
              // Calculate real-time distance from user if userCoords available
              let distanceBadge = null;
              if (userCoords?.latitude && userCoords?.longitude) {
                const coords = getItemCoordinates(item);
                if (coords) {
                  const d = calculateDistanceKm(
                    userCoords.latitude,
                    userCoords.longitude,
                    coords.lat,
                    coords.lng
                  );
                  const formatted = formatDistance(d);
                  if (formatted) {
                    distanceBadge = formatted;
                  }
                }
              }

              return (
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
                    <div className="absolute top-3 right-3">{getStatusBadge(item)}</div>
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-lg text-xs font-medium">
                      {item.category}
                    </div>

                    {/* Real-time Distance Overlay Tag */}
                    {distanceBadge && (
                      <div className="absolute bottom-2.5 left-2.5 bg-emerald-700/90 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs">
                        <Navigation className="w-3 h-3" />
                        <span>{distanceBadge}</span>
                      </div>
                    )}

                    {/* Favorite / Bookmark Heart Button */}
                    <div className="absolute bottom-2.5 right-2.5 z-10">
                      <FavoriteButton
                        itemId={item.id}
                        isFavorited={favoriteIds.has(item.id)}
                        onToggle={handleFavoriteToggle}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 transition line-clamp-1 flex-1">
                          {item.title}
                        </h3>
                        {item.averageRating > 0 && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md flex-shrink-0">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{item.averageRating}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                        {item.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1 truncate max-w-[150px]">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{item.location || 'Local Community'}</span>
                      </div>
                      <Link
                        to={`/items/${item.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex-shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* 🎙️ Multilingual Voice Search Modal */}
      <VoiceSearchModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSearchSubmit={handleVoiceSearchSubmit}
      />
    </div>
  );
};

export default Home;
