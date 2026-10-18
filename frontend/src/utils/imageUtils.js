/**
 * Image utilities for Share-It:
 * Provides smart category and keyword-aware default fallback images.
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
    url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&auto=format&fit=crop&q=80', // TV remote
  },
  {
    keywords: ['camera', 'dslr', 'lens', 'sony alpha', 'canon', 'nikon'],
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80', // Camera
  },
  {
    keywords: ['drill', 'dewalt', 'bosch', 'hammer drill', 'screwdriver'],
    url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80', // Power Drill
  },
  {
    keywords: ['projector', 'screen', 'beamer'],
    url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80', // Projector
  },
  {
    keywords: ['tent', 'sleeping bag', 'backpack', 'trekking'],
    url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80', // Camping Tent
  },
  {
    keywords: ['bicycle', 'bike', 'cycle'],
    url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80', // Bicycle
  },
  {
    keywords: ['ladder', 'step ladder', 'extension ladder'],
    url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb325?w=800&auto=format&fit=crop&q=80', // Ladder
  },
];

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
