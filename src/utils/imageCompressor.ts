/**
 * Client-Side Image Compressor for Agricultural Produce & Pathology Photos
 * Compresses camera/phone photos before upload to ensure fast processing
 * and prevent payload overflow on serverless environments (e.g. Vercel 4.5MB limit).
 */

export interface CompressedImageResult {
  dataUrl: string;
  blob: Blob;
  base64: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  mimeType: string;
}

export async function compressProduceImage(
  source: File | Blob,
  maxDimension = 900,
  quality = 0.85
): Promise<CompressedImageResult> {
  const originalSizeKb = Math.round(source.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const originalDataUrl = event.target?.result as string;

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down proportionally if larger than maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            // Canvas unavailable: fallback to raw dataUrl
            const base64Data = originalDataUrl.split(',')[1] || '';
            return resolve({
              dataUrl: originalDataUrl,
              blob: source,
              base64: base64Data,
              originalSizeKb,
              compressedSizeKb: originalSizeKb,
              mimeType: source.type || 'image/jpeg',
            });
          }

          // Draw scaled image
          ctx.drawImage(img, 0, 0, width, height);

          const mimeType = 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(mimeType, quality);
          const base64 = compressedDataUrl.split(',')[1] || '';

          canvas.toBlob(
            (blob) => {
              const finalBlob = blob || source;
              const compressedSizeKb = Math.round(finalBlob.size / 1024);

              resolve({
                dataUrl: compressedDataUrl,
                blob: finalBlob,
                base64,
                originalSizeKb,
                compressedSizeKb,
                mimeType,
              });
            },
            mimeType,
            quality
          );
        } catch (canvasErr) {
          console.warn('Canvas compression error, using raw image:', canvasErr);
          const base64Data = originalDataUrl.split(',')[1] || '';
          resolve({
            dataUrl: originalDataUrl,
            blob: source,
            base64: base64Data,
            originalSizeKb,
            compressedSizeKb: originalSizeKb,
            mimeType: source.type || 'image/jpeg',
          });
        }
      };

      img.onerror = () => {
        const base64Data = originalDataUrl.split(',')[1] || '';
        resolve({
          dataUrl: originalDataUrl,
          blob: source,
          base64: base64Data,
          originalSizeKb,
          compressedSizeKb: originalSizeKb,
          mimeType: source.type || 'image/jpeg',
        });
      };

      img.src = originalDataUrl;
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.readAsDataURL(source);
  });
}
