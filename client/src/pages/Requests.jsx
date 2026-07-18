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
  const isDeptHead = user?.role === ROLES.DEPARTMENT_HEAD;
  const navigate = useNavigate();

  const { page, setPage } = usePagination();
  const [statusFilter, setStatusFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(isDeptHead ? 'all' : (isAdmin ? 'all' : 'my'));

  const fetchFn = activeTab === 'all' ? getRequests : getMyRequests;

  const { data, loading, pagination, refetch } = useFetch(
    fetchFn,
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

  if (activeTab === 'all') {
    columns.splice(2, 0, { key: 'requester_name', label: 'المقدم' });
  }

  const showSubmitBtn = user?.role === ROLES.EMPLOYEE || user?.role === ROLES.DEPARTMENT_HEAD;
  const pageTitle = activeTab === 'all' ? 'طلبات التعديل' : 'طلباتي';
  const pageSubtitle = activeTab === 'all' ? 'متابعة ومراجعة طلبات الإضافة والتعديل والحذف' : 'متابعة طلبات الإضافة والتعديل والحذف الخاصة بي';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{pageTitle}</h1>
          <p className="text-gray-500 text-lg mt-2">{pageSubtitle}</p>
        </div>
        
        {showSubmitBtn && (
          <Button onClick={() => setIsFormOpen(true)}>
            <FiPlus className="ml-2" />
            تقديم طلب جديد
          </Button>
        )}
      </div>

      {isDeptHead && (
        <div className="flex border-b border-gray-200 gap-6">
          <button
            className={`py-3 px-4 text-base font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => { setActiveTab('all'); setPage(1); }}
          >
            طلبات الموظفين للمراجعة
          </button>
          <button
            className={`py-3 px-4 text-base font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'my'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => { setActiveTab('my'); setPage(1); }}
          >
            طلباتي الخاصة
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <FiFilter className="text-gray-400" size={20} />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-transparent text-base font-medium text-gray-600 focus:outline-none"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">تقديم طلب جديد</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-2xl">&times;</button>
            </div>
            <div className="p-8">
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
