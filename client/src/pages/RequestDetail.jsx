import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiXCircle, FiInfo, FiX } from 'react-icons/fi';
import useFetch from '../hooks/useFetch';
import { getRequest, approveRequest, rejectRequest, getRequestImages } from '../api/requestApi';
import { useAuth } from '../hooks/useAuth';
import { ROLES, REQUEST_TYPE } from '../constants';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { formatDate } from '../utils/helpers';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const { data: request, loading, error, refetch } = useFetch(getRequest, id);
  
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Pending images state
  const [requestImages, setRequestImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Fetch pending images for admin review
  useEffect(() => {
    if (!id || !request) return;
    
    // If it's a delete images request, we don't fetch pending images from temp folder,
    // we use the filenames listed in new_data
    if (request.request_type === REQUEST_TYPE.DELETE_IMAGE) {
      if (request.new_data?.imagesToDelete) {
        const imagesToDeleteUrls = request.new_data.imagesToDelete.map(filename => ({
          filename,
          url: `/uploads/properties/${request.property_file_number}/${filename}`
        }));
        setRequestImages(imagesToDeleteUrls);
      }
      return;
    }

    // Otherwise fetch pending uploaded images
    const fetchImages = async () => {
      setImagesLoading(true);
      try {
        const res = await getRequestImages(id);
        setRequestImages(res.data?.data || []);
      } catch {
        setRequestImages([]);
      } finally {
        setImagesLoading(false);
      }
    };
    fetchImages();
  }, [id, isAdmin, request]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await approveRequest(id);
      toast.success('تم قبول الطلب وتحديث البيانات بنجاح');
      refetch();
    } catch (err) {
      toast.error('فشل قبول الطلب');
    } finally {
      setActionLoading(false);
      setIsApproveModalOpen(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await rejectRequest(id);
      toast.success('تم رفض الطلب');
      refetch();
    } catch (err) {
      toast.error('فشل رفض الطلب');
    } finally {
      setActionLoading(false);
      setIsRejectModalOpen(false);
    }
  };

  if (loading) return <Spinner fullScreen />;
  if (error) return <div className="text-center p-12 text-red-500">{error}</div>;
  if (!request) return null;

  const isPending = request.status === 'في الانتظار';
  const isDeleteImagesRequest = request.request_type === REQUEST_TYPE.DELETE_IMAGE;

  // Helper to render diff row
  const DiffRow = ({ label, oldVal, newVal }) => {
    const isChanged = newVal !== undefined && newVal !== null && newVal !== '' && String(oldVal) !== String(newVal);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-5 border-b border-gray-50 last:border-0">
        <div className="text-base font-bold text-gray-500">{label}</div>
        <div className={`text-base p-3 rounded ${isChanged ? 'text-red-500 line-through bg-red-50' : 'text-gray-600'}`}>
          {oldVal || '-'}
        </div>
        <div className={`text-base p-3 rounded ${isChanged ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-400'}`}>
          {isChanged ? (newVal || '-') : '-'}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/requests')}
          className="flex items-center text-gray-500 hover:text-primary transition-colors text-base font-medium"
        >
          <FiArrowRight className="ml-2" />
          العودة للطلبات
        </button>

        {isAdmin && isPending && (
          <div className="flex gap-2">
            <Button variant="danger" onClick={() => setIsRejectModalOpen(true)}>
              <FiXCircle className="ml-2" />
              رفض الطلب
            </Button>
            <Button onClick={() => setIsApproveModalOpen(true)}>
              <FiCheckCircle className="ml-2" />
              قبول الطلب
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isDeleteImagesRequest ? 'طلب حذف صور' : 'تفاصيل الطلب'} #{request.request_id}
            </h1>
            <p className="text-base text-gray-500 mt-1">مقدم من: {request.requester_name} في {formatDate(request.created_at)}</p>
          </div>
          <Badge status={request.status} />
        </div>

        <div className="p-10">
          <div className="mb-8 p-5 bg-blue-50 border border-blue-100 rounded-lg flex gap-4 text-blue-800">
            <FiInfo className="mt-1 flex-shrink-0" size={20} />
            <div>
              <p className="font-bold text-base">وصف الطلب:</p>
              <p className="text-base mt-1">{request.request_description || 'لا يوجد وصف'}</p>
            </div>
          </div>

          <div className="mb-10 bg-gray-50 p-5 rounded-lg border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-base font-bold text-gray-500">رقم الملف:</span>
              <span className="ml-2 font-bold text-xl text-gray-800">{request.property_file_number}</span>
            </div>
          </div>

          {!isDeleteImagesRequest && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm font-bold text-gray-400 uppercase tracking-wider">
                <div>الحقل</div>
                <div>القيمة الحالية</div>
                <div>القيمة المقترحة</div>
              </div>
              
              <DiffRow label="اسم المالك" oldVal={request.old_data?.owner_name} newVal={request.new_data?.ownerName} />
              <DiffRow label="الرقم الوطني" oldVal={request.old_data?.national_number} newVal={request.new_data?.nationalNumber} />
              <DiffRow label="الموقع" oldVal={request.old_data?.location} newVal={request.new_data?.location} />
              <DiffRow label="المساحة" oldVal={request.old_data?.area} newVal={request.new_data?.area} />
              <DiffRow label="الحالة" oldVal={request.old_data?.status} newVal={request.new_data?.status} />
            </div>
          )}
        </div>
      </div>

      {/* Images Section */}
      {requestImages.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              📷 
              {isDeleteImagesRequest ? (
                <span className="text-red-600">صور مطلوب حذفها ({requestImages.length})</span>
              ) : (
                <span>صور مرفقة بالطلب ({requestImages.length})</span>
              )}
            </h2>
            <p className="text-base text-gray-500 mt-2">
              {isDeleteImagesRequest 
                ? (isPending ? 'سيتم حذف هذه الصور نهائياً من ملف العقار عند القبول' : 'الصور المطلوبة للحذف')
                : (isPending ? 'سيتم نقل هذه الصور لمجلد العقار عند القبول' : 'صور مرفقة')
              }
            </p>
          </div>
          <div className="p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {requestImages.map((img, i) => (
              <div key={i} className={`aspect-square rounded-lg overflow-hidden border-2 bg-gray-50 hover:shadow-md transition-shadow ${isDeleteImagesRequest ? 'border-red-300' : 'border-gray-200'}`}>
                <img
                  src={`${API_BASE}${img.url}`}
                  alt={img.filename}
                  className="w-full h-full object-cover cursor-pointer"
                  loading="lazy"
                  onClick={() => setLightboxImage(img)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && imagesLoading && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-4"
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
            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="mt-4 bg-black/60 text-white px-6 py-4 rounded-xl text-center max-w-2xl min-w-[300px]">
            <p className="font-bold text-lg mb-1">رقم الملف: {request.property_file_number}</p>
            <p className="text-sm text-gray-300">اسم الملف: {lightboxImage.filename}</p>
            {request.request_description && (
              <div className="mt-3 pt-3 border-t border-white/20 text-right">
                <p className="text-xs text-gray-400 font-bold mb-1">وصف الطلب:</p>
                <p className="text-sm leading-relaxed">{request.request_description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleApprove}
        title="قبول الطلب"
        message={isDeleteImagesRequest 
          ? "هل أنت متأكد من قبول هذا الطلب؟ سيتم حذف الصور المحددة نهائياً من النظام ولن يمكن استعادتها."
          : "هل أنت متأكد من قبول هذا الطلب؟ سيتم تحديث بيانات العقار فوراً."
        }
        confirmText={isDeleteImagesRequest ? "قبول وحذف الصور" : "قبول وتحديث"}
        loading={actionLoading}
      />

      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleReject}
        title="رفض الطلب"
        message={isDeleteImagesRequest
          ? "هل أنت متأكد من رفض هذا الطلب؟ سيتم الاحتفاظ بالصور ولن يتم حذفها."
          : "هل أنت متأكد من رفض هذا الطلب؟ لن يتم إجراء أي تغييرات على بيانات العقار."
        }
        confirmText="رفض"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default RequestDetail;
