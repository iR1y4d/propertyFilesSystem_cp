import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiEdit, FiTrash2, FiMapPin, FiMaximize, FiUser, FiHash } from 'react-icons/fi';
import useFetch from '../hooks/useFetch';
import { getProperty, deleteProperty } from '../api/propertyApi';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

const PropertyDetail = () => {
  const { fileNumber } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const { data: property, loading, error } = useFetch(getProperty, fileNumber);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteProperty(fileNumber);
      toast.success('تم حذف العقار بنجاح');
      navigate('/properties');
    } catch (err) {
      toast.error('فشل حذف العقار');
    }
  };

  if (loading) return <Spinner fullScreen />;
  if (error) return (
    <div className="text-center p-12">
      <p className="text-red-500 mb-4">{error}</p>
      <Button onClick={() => navigate('/properties')}>العودة للعقارات</Button>
    </div>
  );
  if (!property) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/properties')}
          className="flex items-center text-gray-500 hover:text-primary transition-colors text-sm font-medium"
        >
          <FiArrowRight className="ml-2" />
          العودة للقائمة
        </button>

        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/properties')}>
              <FiEdit className="ml-2" />
              تعديل
            </Button>
            <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
              <FiTrash2 className="ml-2" />
              حذف
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-primary/5 p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-lg text-white font-bold text-xl">
              {property.property_file_number}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{property.owner_name}</h1>
              <p className="text-sm text-gray-500">ملف عقاري رقم {property.property_file_number}</p>
            </div>
          </div>
          <Badge status={property.status} />
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <FiUser className="text-primary mt-1" size={20} />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">اسم المالك</p>
                  <p className="text-lg font-semibold text-gray-800">{property.owner_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <FiHash className="text-primary mt-1" size={20} />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">الرقم الوطني</p>
                  <p className="text-lg font-semibold text-gray-800">{property.national_number}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <FiMapPin className="text-primary mt-1" size={20} />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">الموقع</p>
                  <p className="text-lg font-semibold text-gray-800">{property.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <FiMaximize className="text-primary mt-1" size={20} />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">المساحة</p>
                  <p className="text-lg font-semibold text-gray-800">{property.area}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 mb-4">معلومات إضافية</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">تاريخ الإنشاء</p>
                <p className="text-sm text-gray-600">{new Date(property.created_at).toLocaleString('ar-JO')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">آخر تحديث</p>
                <p className="text-sm text-gray-600">{new Date(property.updated_at).toLocaleString('ar-JO')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف العقار رقم ${property.property_file_number}؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        variant="danger"
      />
    </div>
  );
};

export default PropertyDetail;
