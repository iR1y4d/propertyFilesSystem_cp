import { useState } from 'react';
import { FiPlus, FiEdit, FiImage } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants';
import { getProperties, searchProperties, deleteProperty } from '../api/propertyApi';
import useFetch from '../hooks/useFetch';
import usePagination from '../hooks/usePagination';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import PropertyForm from '../components/forms/PropertyForm';
import EditRequestForm from '../components/forms/EditRequestForm';
import ImageGallery from '../components/common/ImageGallery';
import { toast } from 'react-hot-toast';

const Properties = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const { page, setPage } = usePagination();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [isEditRequestOpen, setIsEditRequestOpen] = useState(false);
  const [editRequestProperty, setEditRequestProperty] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageProperty, setImageProperty] = useState(null);

  const { data, loading, pagination, refetch } = useFetch(
    searchTerm ? searchProperties : getProperties,
    { page, limit: 10, ...(searchTerm && { search: searchTerm }) }
  );

  const handleSearch = (term) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handleEdit = (property) => {
    setSelectedProperty(property);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (property) => {
    setPropertyToDelete(property);
    setIsDeleteModalOpen(true);
  };

  const handleEditRequest = (property) => {
    setEditRequestProperty(property);
    setIsEditRequestOpen(true);
  };

  const handleViewImages = (property) => {
    setImageProperty(property);
    setIsImageModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteProperty(propertyToDelete.property_file_number);
      toast.success('تم حذف العقار بنجاح');
      refetch();
    } catch (error) {
      toast.error('فشل حذف العقار');
    } finally {
      setIsDeleteModalOpen(false);
      setPropertyToDelete(null);
    }
  };

  const columns = [
    { key: 'property_file_number', label: 'رقم الملف', render: (row) => <span className="font-bold">{row.property_file_number}</span> },
    { key: 'owner_name', label: 'اسم المالك' },
    { key: 'national_number', label: 'الرقم الوطني' },
    { key: 'location', label: 'الموقع' },
    { key: 'area', label: 'المساحة' },
    { key: 'status', label: 'الحالة', render: (row) => <Badge status={row.status} /> },
    {
      key: 'images',
      label: 'الصور',
      render: (row) => (
        <button
          onClick={() => handleViewImages(row)}
          className={`flex items-center gap-1 transition-colors ${
            row.has_images
              ? 'text-blue-600 hover:text-blue-800'
              : 'text-gray-300 hover:text-gray-500'
          }`}
          title={row.has_images ? 'عرض الصور' : 'لا توجد صور'}
        >
          <FiImage size={18} />
          {!row.has_images && (
            <span className="text-xs text-gray-400">—</span>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (row) => (
        <div className="flex gap-2">
          {isAdmin ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => handleEdit(row)}>تعديل</Button>
              <Button variant="danger" size="sm" onClick={() => handleDeleteClick(row)}>حذف</Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => handleEditRequest(row)}>
              <FiEdit className="ml-2" />
              طلب تعديل
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة العقارات</h1>
          <p className="text-gray-500">البحث والتحكم في ملفات العقارات</p>
        </div>
        
        {isAdmin && (
          <Button onClick={() => { setSelectedProperty(null); setIsFormOpen(true); }}>
            <FiPlus className="ml-2" />
            إضافة عقار جديد
          </Button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <SearchBar value={searchTerm} onChange={handleSearch} placeholder="البحث باسم المالك..." />
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="لم يتم العثور على عقارات"
      />

      {pagination && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Property Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedProperty ? 'تعديل بيانات العقار' : 'إضافة عقار جديد'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6">
              <PropertyForm
                initialData={selectedProperty}
                onSuccess={() => { setIsFormOpen(false); refetch(); }}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Request Modal */}
      {isEditRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">طلب تعديل بيانات العقار</h2>
              <button onClick={() => setIsEditRequestOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6">
              <EditRequestForm
                property={editRequestProperty}
                onSuccess={() => { setIsEditRequestOpen(false); refetch(); }}
                onCancel={() => setIsEditRequestOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {isImageModalOpen && imageProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">
                صور العقار رقم {imageProperty.property_file_number}
              </h2>
              <button onClick={() => setIsImageModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6">
              <ImageGallery propertyFileNumber={imageProperty.property_file_number} isAdmin={isAdmin} />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف العقار رقم ${propertyToDelete?.property_file_number}؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        variant="danger"
      />
    </div>
  );
};

export default Properties;
