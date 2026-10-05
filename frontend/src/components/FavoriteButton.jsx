import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const FavoriteButton = ({
  itemId,
  isFavorited = false,
  onToggle = null,
  size = 'md',
  className = '',
  showLabel = false,
}) => {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(isFavorited);
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setFavorited(isFavorited);
  }, [isFavorited]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please log in to save items to your favorites!');
      return;
    }

    if (loading) return;

    const previousState = favorited;
    const nextState = !previousState;
    setFavorited(nextState);
    setAnimate(true);
    setTimeout(() => setAnimate(false), 300);

    setLoading(true);
    try {
      const res = await api.post(`/favorites/${itemId}/toggle`);
      const isNowFav = res.data?.favorited;
      setFavorited(isNowFav);
      if (onToggle) {
        onToggle(itemId, isNowFav);
      }
    } catch (err) {
      // Revert on error
      setFavorited(previousState);
      alert('Failed to update favorite status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-7 h-7 p-1.5',
    md: 'w-9 h-9 p-2',
    lg: 'w-11 h-11 p-2.5',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title={favorited ? 'Remove from Saved' : 'Save to Favorites'}
      className={`relative inline-flex items-center justify-center gap-1.5 rounded-full transition-all duration-200 backdrop-blur-md shadow-xs active:scale-90 ${
        favorited
          ? 'bg-red-50/95 dark:bg-red-950/80 text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900'
          : 'bg-white/90 dark:bg-slate-900/80 text-gray-500 dark:text-gray-400 border border-gray-200/80 dark:border-slate-700/80 hover:text-red-500 hover:bg-white dark:hover:bg-slate-900'
      } ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <Heart
        className={`${iconSizes[size] || iconSizes.md} transition-transform duration-200 ${
          favorited ? 'fill-red-500 stroke-red-500' : 'stroke-current'
        } ${animate ? 'scale-125' : 'scale-100'}`}
      />
      {showLabel && (
        <span className="text-xs font-bold pr-1">
          {favorited ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  );
};

export default FavoriteButton;
