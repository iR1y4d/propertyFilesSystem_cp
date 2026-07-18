import { useState, useEffect } from 'react';
import { FiX, FiZoomIn, FiImage, FiTrash2, FiCheckSquare, FiSquare } from 'react-icons/fi';
import { getPropertyImages, uploadPropertyImages, deletePropertyImage } from '../../api/propertyApi';
import { submitRequest } from '../../api/requestApi';
import ImageUploader from './ImageUploader';
import Modal from './Modal';
import Spinner from './Spinner';
import { toast } from 'react-hot-toast';
import { API_BASE } from '../../constants';

// Derive backend origin for static files (images are served from root, not /api/v1)
const BACKEND_URL = API_BASE.replace(/\/api\/v1\/?$/, '');

const ImageGallery = ({ propertyFileNumber, isAdmin = false, isDeptHead = false, onImagesChange }) => {
  const canDirectAction = isAdmin || isDeptHead;
  const canRequestAction = !isAdmin; // Admin cannot request delete, but Employee and Dept Head can
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

  // Employee delete request state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedImagesForDeletion, setSelectedImagesForDeletion] = useState([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestDescription, setRequestDescription] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await getPropertyImages(propertyFileNumber);
      const fetchedImages = res.data?.data || [];
      setImages(fetchedImages);
      setSelectedImagesForDeletion([]);
      setSelectionMode(false);
      if (onImagesChange) {
        onImagesChange(fetchedImages.length > 0);
      }
    } catch {
      setImages([]);
      if (onImagesChange) {
        onImagesChange(false);
      }
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

  // Employee: toggle selection
  const toggleImageSelection = (filename) => {
    setSelectedImagesForDeletion(prev => 
      prev.includes(filename) 
        ? prev.filter(f => f !== filename)
        : [...prev, filename]
    );
  };

  // Employee: submit delete request
  const handleSubmitDeleteRequest = async () => {
    if (selectedImagesForDeletion.length === 0) return;
    
    if (!requestDescription || requestDescription.trim() === '') {
      toast.error('يرجى توضيح سبب الحذف');
      return;
    }

    setSubmittingRequest(true);
    try {
      await submitRequest({
        propertyFileNumber: parseInt(propertyFileNumber, 10),
        requestType: 'حذف_صور',
        requestDescription: requestDescription.trim(),
        newData: {
          imagesToDelete: selectedImagesForDeletion
        }
      });
      toast.success('تم تقديم طلب حذف الصور بنجاح');
      setIsRequestModalOpen(false);
      setSelectionMode(false);
      setSelectedImagesForDeletion([]);
      setRequestDescription('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل إرسال طلب الحذف');
    } finally {
      setSubmittingRequest(false);
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
      {/* Admin/Dept Head: Upload section */}
      {canDirectAction && (
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
            {canDirectAction ? 'استخدم النموذج أعلاه لرفع الصور' : `لإضافة صور، ضع الملفات في المجلد: uploads/properties/${propertyFileNumber}/`}
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-500">{images.length} صورة</p>
            
            {/* Employee/Dept Head: Selection tools */}
            {canRequestAction && (
              <div className="flex gap-2">
                {selectionMode ? (
                  <>
                    <button 
                      onClick={() => { setSelectionMode(false); setSelectedImagesForDeletion([]); }}
                      className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button 
                      onClick={() => setIsRequestModalOpen(true)}
                      disabled={selectedImagesForDeletion.length === 0}
                      className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      طلب حذف ({selectedImagesForDeletion.length})
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setSelectionMode(true)}
                    className="px-3 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors"
                  >
                    طلب حذف صور
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((image, index) => {
              const isSelected = selectedImagesForDeletion.includes(image.filename);
              return (
                <div
                  key={index}
                  className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected ? 'border-red-500 shadow-sm' : 'border-gray-200 bg-gray-50 hover:shadow-md'
                  }`}
                  onClick={() => {
                    if (selectionMode) {
                      toggleImageSelection(image.filename);
                    } else {
                      setLightboxImage(image);
                    }
                  }}
                >
                  <img
                    src={`${BACKEND_URL}${image.url}`}
                    alt={image.filename}
                    className={`w-full h-full object-cover transition-transform ${isSelected ? 'opacity-80' : 'group-hover:scale-105'}`}
                    loading="lazy"
                  />
                  
                  {/* Selection Checkbox (Employee Mode) */}
                  {selectionMode && (
                    <div className="absolute top-2 right-2 z-20">
                      {isSelected ? (
                        <FiCheckSquare className="text-red-500 bg-white" size={20} />
                      ) : (
                        <FiSquare className="text-gray-300 bg-black/20 rounded" size={20} />
                      )}
                    </div>
                  )}

                  {/* Hover overlay (Normal Mode) */}
                  {!selectionMode && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="p-2 bg-white/90 rounded-full text-gray-700">
                        <FiZoomIn size={18} />
                      </div>
                    </div>
                  )}

                  {/* Admin/Dept Head: Delete button */}
                  {canDirectAction && (
                    <button
                      onClick={(e) => { e.stopPropagation(); confirmDeleteImage(image); }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="حذف الصورة مباشرة"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}

                  {/* Filename at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {image.filename}
                  </div>
                </div>
              );
            })}
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
            src={`${BACKEND_URL}${lightboxImage.url}`}
            alt={lightboxImage.filename}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
            {lightboxImage.filename}
          </div>
        </div>
      )}

      {/* Admin Delete Confirmation Modal */}
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

      {/* Employee Delete Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onConfirm={handleSubmitDeleteRequest}
        title="طلب حذف صور"
        message={`هل أنت متأكد من رغبتك في تقديم طلب لحذف ${selectedImagesForDeletion.length} صورة؟`}
        confirmText="إرسال الطلب"
        variant="danger"
        loading={submittingRequest}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">سبب الحذف <span className="text-red-500">*</span></label>
          <textarea
            value={requestDescription}
            onChange={(e) => setRequestDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-red-500 focus:border-red-500"
            rows={3}
            placeholder="يرجى توضيح سبب الحذف..."
          />
        </div>
      </Modal>
    </div>
  );
};

export default ImageGallery;
