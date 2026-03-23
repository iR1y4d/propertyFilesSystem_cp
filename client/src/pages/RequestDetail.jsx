import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiXCircle, FiInfo } from 'react-icons/fi';
import useFetch from '../hooks/useFetch';
import { getRequest, approveRequest, rejectRequest } from '../api/requestApi';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { formatDate } from '../utils/helpers';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const { data: request, loading, error, refetch } = useFetch(getRequest, id);
  
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  // Helper to render diff row
  const DiffRow = ({ label, oldVal, newVal }) => {
    const isChanged = newVal !== undefined && newVal !== null && newVal !== '' && String(oldVal) !== String(newVal);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-b border-gray-50 last:border-0">
        <div className="text-sm font-bold text-gray-500">{label}</div>
        <div className={`text-sm p-2 rounded ${isChanged ? 'text-red-500 line-through bg-red-50' : 'text-gray-600'}`}>
          {oldVal || '-'}
        </div>
        <div className={`text-sm p-2 rounded ${isChanged ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-400'}`}>
          {isChanged ? (newVal || '-') : '-'}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/requests')}
          className="flex items-center text-gray-500 hover:text-primary transition-colors text-sm font-medium"
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
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h1 className="text-xl font-bold text-gray-800">تفاصيل الطلب #{request.request_id}</h1>
            <p className="text-sm text-gray-500">مقدم من: {request.requester_name} في {formatDate(request.created_at)}</p>
          </div>
          <Badge status={request.status} />
        </div>

        <div className="p-8">
          <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 text-blue-800">
            <FiInfo className="mt-1 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">وصف الطلب:</p>
              <p className="text-sm">{request.request_description}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
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
        </div>
      </div>

      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleApprove}
        title="قبول الطلب"
        message="هل أنت متأكد من قبول هذا الطلب؟ سيتم تحديث بيانات العقار فوراً."
        confirmText="قبول وتحديث"
        loading={actionLoading}
      />

      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleReject}
        title="رفض الطلب"
        message="هل أنت متأكد من رفض هذا الطلب؟ لن يتم إجراء أي تغييرات على بيانات العقار."
        confirmText="رفض"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default RequestDetail;
