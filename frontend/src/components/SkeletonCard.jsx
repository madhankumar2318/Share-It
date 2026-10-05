import React from 'react';

/**
 * Item Card Shimmer Placeholder for Home and Catalog grids
 */
export const ItemCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs animate-pulse flex flex-col h-full">
    {/* Image placeholder */}
    <div className="w-full h-52 bg-slate-200 dark:bg-slate-800 relative">
      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700" />
      <div className="absolute top-3 left-3 w-20 h-6 rounded-full bg-slate-300 dark:bg-slate-700" />
    </div>
    {/* Content placeholder */}
    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
      <div className="space-y-2.5">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-full" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-2/3" />
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16" />
        </div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-14" />
      </div>
    </div>
  </div>
);

/**
 * Dashboard Row / Card Shimmer Placeholder
 */
export const DashboardRowSkeleton = () => (
  <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs animate-pulse flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
    <div className="flex items-center gap-4 w-full md:w-auto">
      <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-32" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-24" />
      </div>
    </div>
    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
      <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl w-24" />
      <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl w-24" />
    </div>
  </div>
);

/**
 * Item Detail Page Shimmer Placeholder
 */
export const ItemDetailSkeleton = () => (
  <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-32 mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="w-full h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="space-y-3">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-full" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-4/5" />
        </div>
      </div>
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-5 h-96">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full" />
        <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full" />
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
      </div>
    </div>
  </div>
);

export default ItemCardSkeleton;
