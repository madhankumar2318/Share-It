/**
 * Client-Side Image Compression Utility
 * Resizes large camera photos to a max boundary (e.g. 1200px) and compresses quality
 * to reduce 5MB - 10MB phone uploads down to ~100KB - 200KB before hitting the server.
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.75,
    maxSizeKB = 250, // if already smaller, don't compress
  } = options;

  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  // If file is already tiny (less than maxSizeKB), skip compression
  if (file.size <= maxSizeKB * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // fallback
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG blob with target quality
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // If compression didn't help, return original
              resolve(file);
              return;
            }

            // Create a new File object preserving filename
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => resolve(file); // fallback on error
      img.src = e.target.result;
    };

    reader.onerror = () => resolve(file); // fallback on error
    reader.readAsDataURL(file);
  });
}
