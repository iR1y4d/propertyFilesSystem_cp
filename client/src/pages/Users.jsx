import { useState } from 'react';
import { FiUserPlus, FiKey, FiLock, FiUnlock, FiTrash2, FiEdit } from 'react-icons/fi';
import { getUsers, deleteUser, resetPassword, unlockAccount } from '../api/userApi';
import useFetch from '../hooks/useFetch';
import usePagination from '../hooks/usePagination';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import UserForm from '../components/forms/UserForm';
import { toast } from 'react-hot-toast';
import { formatDate } from '../utils/helpers';

const Users = () => {
  const { page, setPage } = usePagination();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);

  const { data, loading, pagination, refetch } = useFetch(getUsers, { page, limit: 10 });

  const handleAction = (user, type) => {
    setTargetUser(user);
    if (type === 'delete') setIsDeleteModalOpen(true);
    if (type === 'reset') setIsResetModalOpen(true);
    if (type === 'unlock') setIsUnlockModalOpen(true);
    if (type === 'edit') {
      setSelectedUser(user);
      setIsFormOpen(true);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(targetUser.user_id);
      toast.success('تم حذف المستخدم بنجاح');
      refetch();
    } catch (err) {
      toast.error('فشل حذف المستخدم');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const confirmReset = async () => {
    try {
      // For simplicity, we just trigger reset. A real app might take a new password.
      await resetPassword(targetUser.user_id, { password: 'Reset@2026' });
      toast.success('تم إعادة تعيين كلمة المرور إلى: Reset@2026');
    } catch (err) {
      toast.error('فشل إعادة تعيين كلمة المرور');
    } finally {
      setIsResetModalOpen(false);
    }
  };

  const confirmUnlock = async () => {
    try {
      await unlockAccount(targetUser.user_id);
      toast.success('تم فتح قفل الحساب بنجاح');
      refetch();
    } catch (err) {
      toast.error('فشل فتح القفل');
    } finally {
      setIsUnlockModalOpen(false);
    }
  };

  const columns = [
    { key: 'full_name', label: 'الاسم', render: (row) => `${row.first_name} ${row.last_name}` },
    { key: 'username', label: 'اسم المستخدم', render: (row) => <span className="font-medium text-primary">{row.username}</span> },
    { key: 'role', label: 'الدور', render: (row) => <Badge status={row.role} /> },
    { key: 'is_locked', label: 'الحالة', render: (row) => (
      row.is_locked ? (
        <span className="flex items-center gap-1 text-red-500 text-xs font-bold"><FiLock /> مقفل</span>
      ) : (
        <span className="text-green-500 text-xs font-bold">نشط</span>
      )
    )},
    { key: 'created_at', label: 'تاريخ الإنشاء', render: (row) => formatDate(row.created_at) },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleAction(row, 'edit')} title="تعديل"><FiEdit /></Button>
          <Button variant="secondary" size="sm" onClick={() => handleAction(row, 'reset')} title="إعادة تعيين"><FiKey /></Button>
          {row.is_locked && <Button variant="secondary" size="sm" onClick={() => handleAction(row, 'unlock')} title="إلغاء القفل"><FiUnlock /></Button>}
          <Button variant="danger" size="sm" onClick={() => handleAction(row, 'delete')} title="حذف"><FiTrash2 /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
          <p className="text-gray-500">إضافة وتعديل صلاحيات الموظفين</p>
        </div>
        
        <Button onClick={() => { setSelectedUser(null); setIsFormOpen(true); }}>
          <FiUserPlus className="ml-2" />
          إضافة مستخدم جديد
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
      />

      {pagination && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}

      {/* User Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6">
              <UserForm
                initialData={selectedUser}
                onSuccess={() => { setIsFormOpen(false); refetch(); }}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="حذف مستخدم"
        message={`هل أنت متأكد من حذف حساب ${targetUser?.username}؟`}
        confirmText="حذف"
        variant="danger"
      />

      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={confirmReset}
        title="إعادة تعيين كلمة المرور"
        message={`سيتم تعيين كلمة مرور افتراضية (Reset@2026) للمستخدم ${targetUser?.username}. هل تريد المتابعة؟`}
        confirmText="تأكيد"
      />

      <Modal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        onConfirm={confirmUnlock}
        title="إلغاء قفل الحساب"
        message={`فتح قفل حساب ${targetUser?.username} لتمكينه من تسجيل الدخول مرة أخرى.`}
        confirmText="فتح القفل"
      />
    </div>
  );
};

export default Users;
