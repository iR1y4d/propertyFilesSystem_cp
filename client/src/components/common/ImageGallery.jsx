import { useState, useEffect } from 'react';
import { FiX, FiZoomIn, FiImage } from 'react-icons/fi';
import { getPropertyImages } from '../../api/propertyApi';
import Spinner from './Spinner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ImageGallery = ({ propertyFileNumber }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    if (!propertyFileNumber) return;

    const fetchImages = async () => {
      try {
        setLoading(true);
        const res = await getPropertyImages(propertyFileNumber);
        setImages(res.data?.data || []);
      } catch {
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [propertyFileNumber]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
        <FiImage size={48} className="mb-3 opacity-50" />
        <p className="text-sm">لا توجد صور لهذا العقار</p>
        <p className="text-xs mt-1 text-gray-300">
          لإضافة صور، ضع الملفات في المجلد: uploads/properties/{propertyFileNumber}/
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">{images.length} صورة</p>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((image, index) => (
          <div
            key={index}
            className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLightboxImage(image)}
          >
            <img
              src={`${API_BASE}${image.url}`}
              alt={image.filename}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="p-2 bg-white/90 rounded-full text-gray-700">
                <FiZoomIn size={18} />
              </div>
            </div>
            {/* Filename at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
              {image.filename}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <FiX size={24} />
          </button>
          <img
            src={`${API_BASE}${lightboxImage.url}`}
            alt={lightboxImage.filename}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
            {lightboxImage.filename}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
