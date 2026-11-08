/**
 * Image utilities for Share-It:
 * Provides smart category and keyword-aware default fallback images,
 * robust URL resolution, and bulletproof error fallback handlers.
 */

// Category and title-aware high-resolution default images
export const CATEGORY_FALLBACK_IMAGES = {
  'Electronics': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80',
  'Tools & DIY': 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&auto=format&fit=crop&q=80',
  'Outdoors & Camping': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&auto=format&fit=crop&q=80',
  'Home & Kitchen': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
  'Books & Study': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
  'Sports & Fitness': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
  'Party & Games': 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&auto=format&fit=crop&q=80',
  'default': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80',
};

// Specialized keyword-aware fallbacks for common community items
export const KEYWORD_FALLBACK_IMAGES = [
  {
    keywords: ['remote', 'tv remote', 'controller', 'remote control'],
    url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['camera', 'dslr', 'lens', 'sony alpha', 'canon', 'nikon'],
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['drill', 'dewalt', 'bosch', 'hammer drill', 'screwdriver'],
    url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['projector', 'screen', 'beamer'],
    url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['tent', 'sleeping bag', 'backpack', 'trekking'],
    url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['bicycle', 'bike', 'cycle'],
    url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['ladder', 'step ladder', 'extension ladder'],
    url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb325?w=800&auto=format&fit=crop&q=80',
  },
];

// Offline, reliable SVG placeholder if network/Unsplash is blocked
export const FALLBACK_SVG = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22400%22%20viewBox%3D%220%200%20600%20400%22%3E%3Crect%20fill%3D%22%231e293b%22%20width%3D%22600%22%20height%3D%22400%22%2F%3E%3Ccircle%20cx%3D%22300%22%20cy%3D%22180%22%20r%3D%2250%22%20fill%3D%22none%22%20stroke%3D%22%23059669%22%20stroke-width%3D%228%22%2F%3E%3Cpath%20d%3D%22M220%20220%20L270%20160%20L310%20200%20L350%20140%20L400%20220%20Z%22%20fill%3D%22%2310b981%22%20opacity%3D%220.7%22%2F%3E%3Ctext%20x%3D%22300%22%20y%3D%22280%22%20fill%3D%22%2394a3b8%22%20font-family%3D%22sans-serif%22%20font-size%3D%2218%22%20font-weight%3D%22600%22%20text-anchor%3D%22middle%22%3EShareIt%20Community%20Item%3C%2Ftext%3E%3C%2Fsvg%3E";

/**
 * Returns a high-quality relevant image matching the item's title or category
 */
export function getDefaultItemImage(category = '', title = '') {
  const cleanTitle = (title || '').toLowerCase();
  for (const entry of KEYWORD_FALLBACK_IMAGES) {
    if (entry.keywords.some((k) => cleanTitle.includes(k))) {
      return entry.url;
    }
  }

  if (category && CATEGORY_FALLBACK_IMAGES[category]) {
    return CATEGORY_FALLBACK_IMAGES[category];
  }

  return CATEGORY_FALLBACK_IMAGES['default'];
}

/**
 * Normalizes item image URLs, automatically re-routing legacy backend references
 * or relative paths to the active Render production backend.
 */
export function resolveItemImageUrl(url, category = '', title = '') {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return getDefaultItemImage(category, title);
  }
  let cleanUrl = url.trim();

  // 1. Remap old deleted Render service (share-it-wmi3) or localhost to current active Render backend
  if (cleanUrl.includes('share-it-wmi3.onrender.com') || cleanUrl.includes('localhost:') || cleanUrl.includes('127.0.0.1:')) {
    const fileName = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
    return `https://share-it-xd01.onrender.com/api/files/${fileName}`;
  }

  // 2. Remap root-relative or relative paths to active Render backend
  if (cleanUrl.startsWith('/api/files/') || cleanUrl.startsWith('/files/')) {
    const fileName = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
    return `https://share-it-xd01.onrender.com/api/files/${fileName}`;
  }

  // 3. If raw filename without slash, prepend backend endpoint
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('data:')) {
    return `https://share-it-xd01.onrender.com/api/files/${cleanUrl}`;
  }

  return cleanUrl;
}

/**
 * Robust image error handler that breaks infinite fallback loops and cascades to reliable SVG
 */
export function handleImageError(e, category = '', title = '') {
  if (!e || !e.target) return;
  e.target.onerror = null; // Break infinite retry loop
  const fallback = getDefaultItemImage(category, title);
  if (e.target.src !== fallback) {
    e.target.src = fallback;
    e.target.onerror = () => {
      e.target.onerror = null;
      e.target.src = FALLBACK_SVG;
    };
  } else {
    e.target.src = FALLBACK_SVG;
  }
}
