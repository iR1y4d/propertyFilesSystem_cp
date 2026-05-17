import { useState } from 'react';
import { FiFilter, FiRefreshCw } from 'react-icons/fi';
import { getLogs } from '../api/logApi';
import useFetch from '../hooks/useFetch';
import usePagination from '../hooks/usePagination';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import { formatDate } from '../utils/helpers';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { LOG_ACTIONS } from '../constants';

const Logs = () => {
  const { page, setPage } = usePagination();
  const [actionFilter, setActionFilter] = useState('');

  const { data, loading, pagination, refetch } = useFetch(getLogs, {
    page,
    limit: 15,
    ...(actionFilter && { action: actionFilter }),
  });

  const columns = [
    { key: 'log_id', label: 'ID', render: (row) => <span className="text-gray-400">#{row.log_id}</span> },
    { key: 'username', label: 'المستخدم', render: (row) => <span className="font-medium text-gray-800">{row.username}</span> },
    { key: 'action', label: 'الإجراء', render: (row) => (
      <Badge status={row.action} />
    )},
    { key: 'target', label: 'الهدف', render: (row) => (
      row.target ? <span className="text-primary font-bold">{row.target}</span> : <span className="text-gray-300">-</span>
    )},
    { key: 'time', label: 'التاريخ والوقت', render: (row) => formatDate(row.time) },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">سجل التدقيق</h1>
          <p className="text-gray-500 text-lg mt-2">سجل كامل بجميع العمليات التي تمت على النظام</p>
        </div>
        
        <Button variant="secondary" onClick={() => refetch()}>
          <FiRefreshCw className="ml-2" />
          تحديث السجل
        </Button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <FiFilter className="text-gray-400" size={20} />
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="bg-transparent text-base font-medium text-gray-600 focus:outline-none"
        >
          <option value="">جميع العمليات</option>
          <option value={LOG_ACTIONS.LOGIN}>تسجيل الدخول</option>
          <option value={LOG_ACTIONS.LOGOUT}>تسجيل الخروج</option>
          <option value={LOG_ACTIONS.ADD}>إضافة عقار/مستخدم</option>
          <option value={LOG_ACTIONS.EDIT}>تعديل</option>
          <option value={LOG_ACTIONS.DELETE}>حذف</option>
          <option value={LOG_ACTIONS.SEARCH}>بحث</option>
          <option value={LOG_ACTIONS.REQUEST}>تقديم طلب</option>
          <option value={LOG_ACTIONS.APPROVE}>موافقة على طلب</option>
          <option value={LOG_ACTIONS.REJECT}>رفض طلب</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="لا توجد سجلات مطابقة للبحث"
      />

      {pagination && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default Logs;
