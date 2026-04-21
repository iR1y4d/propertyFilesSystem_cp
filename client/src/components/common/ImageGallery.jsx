import { useState, useEffect } from 'react';
import { FiX, FiZoomIn, FiImage, FiTrash2 } from 'react-icons/fi';
import { getPropertyImages, uploadPropertyImages, deletePropertyImage } from '../../api/propertyApi';
import ImageUploader from './ImageUploader';
import Modal from './Modal';
import Spinner from './Spinner';
import { toast } from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ImageGallery = ({ propertyFileNumber, isAdmin = false }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Admin upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Admin delete state
  const [imageToDelete, setImageToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    if (!propertyFileNumber) return;
    fetchImages();
  }, [propertyFileNumber]);

  // Admin: upload new images
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => formData.append('images', file));
      await uploadPropertyImages(propertyFileNumber, formData);
      toast.success(`تم رفع ${selectedFiles.length} صورة بنجاح`);
      setSelectedFiles([]);
      fetchImages();
    } catch {
      toast.error('فشل رفع الصور');
    } finally {
      setUploading(false);
    }
  };

  // Admin: confirm delete
  const confirmDeleteImage = (image) => {
    setImageToDelete(image);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;
    setDeleting(true);
    try {
      await deletePropertyImage(propertyFileNumber, imageToDelete.filename);
      toast.success('تم حذف الصورة بنجاح');
      fetchImages();
    } catch {
      toast.error('فشل حذف الصورة');
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
      setImageToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      {/* Admin: Upload section */}
      {isAdmin && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <h3 className="text-sm font-bold text-gray-700 mb-3">رفع صور جديدة</h3>
          <ImageUploader onFilesSelected={setSelectedFiles} />
          {selectedFiles.length > 0 && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? 'جار الرفع...' : `رفع ${selectedFiles.length} صورة`}
            </button>
          )}
        </div>
      )}

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <FiImage size={48} className="mb-3 opacity-50" />
          <p className="text-sm">لا توجد صور لهذا العقار</p>
          <p className="text-xs mt-1 text-gray-300">
            {isAdmin ? 'استخدم النموذج أعلاه لرفع الصور' : `لإضافة صور، ضع الملفات في المجلد: uploads/properties/${propertyFileNumber}/`}
          </p>
        </div>
      ) : (
        <>
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
                {/* Admin: Delete button */}
                {isAdmin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); confirmDeleteImage(image); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="حذف الصورة"
                  >
                    <FiTrash2 size={14} />
                  </button>
                )}
                {/* Filename at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {image.filename}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setImageToDelete(null); }}
        onConfirm={handleDeleteImage}
        title="حذف صورة"
        message={`هل أنت متأكد من حذف الصورة "${imageToDelete?.filename}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default ImageGallery;
