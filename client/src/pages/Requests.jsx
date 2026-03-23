import { useState } from 'react';
import { FiPlus, FiFilter } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants';
import { getRequests, getMyRequests } from '../api/requestApi';
import useFetch from '../hooks/useFetch';
import usePagination from '../hooks/usePagination';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import RequestForm from '../components/forms/RequestForm';
import { formatDate } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const Requests = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const navigate = useNavigate();

  const { page, setPage } = usePagination();
  const [statusFilter, setStatusFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, loading, pagination, refetch } = useFetch(
    isAdmin ? getRequests : getMyRequests,
    { page, limit: 10, ...(statusFilter && { status: statusFilter }) }
  );

  const columns = [
    { key: 'request_id', label: 'رقم الطلب', render: (row) => <span className="font-bold">#{row.request_id}</span> },
    { key: 'property_file_number', label: 'رقم الملف' },
    { key: 'request_type', label: 'نوع الطلب' },
    { key: 'status', label: 'الحالة', render: (row) => <Badge status={row.status} /> },
    { key: 'created_at', label: 'التاريخ', render: (row) => formatDate(row.created_at) },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => navigate(`/requests/${row.request_id}`)}>
          عرض التفاصيل
        </Button>
      ),
    },
  ];

  if (isAdmin) {
    columns.splice(2, 0, { key: 'requester_name', label: 'المقدم' });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isAdmin ? 'طلبات التعديل' : 'طلباتي'}</h1>
          <p className="text-gray-500">متابعة طلبات الإضافة والتعديل والحذف</p>
        </div>
        
        {!isAdmin && (
          <Button onClick={() => setIsFormOpen(true)}>
            <FiPlus className="ml-2" />
            تقديم طلب جديد
          </Button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <FiFilter className="text-gray-400" />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-transparent text-sm font-medium text-gray-600 focus:outline-none"
        >
          <option value="">جميع الحالات</option>
          <option value="في الانتظار">في الانتظار</option>
          <option value="مقبول">مقبول</option>
          <option value="مرفوض">مرفوض</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="لا توجد طلبات حالياً"
      />

      {pagination && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Request Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">تقديم طلب جديد</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6">
              <RequestForm
                onSuccess={() => { setIsFormOpen(false); refetch(); }}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
