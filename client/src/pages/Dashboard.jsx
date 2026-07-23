import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFileText, FiSend, FiUsers, FiActivity } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants';
import { getProperties } from '../api/propertyApi';
import { getRequests, getMyRequests } from '../api/requestApi';
import { getUsers } from '../api/userApi';
import { getLogs } from '../api/logApi';
import DataTable from '../components/common/DataTable';
import { formatDate } from '../utils/helpers';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const isDeptHead = user?.role === ROLES.DEPARTMENT_HEAD;

  const [stats, setStats] = useState({
    totalProperties: 0,
    pendingRequests: 0,
    totalUsers: 0,
    myPending: 0,
    myApproved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentData, setRecentData] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          // Explicitly use Promise.allSettled or separate try/catches to be robust
          const [propsRes, reqsRes, usersRes, logsRes] = await Promise.allSettled([
            getProperties({ limit: 1 }),
            getRequests({ status: 'في الانتظار', limit: 1 }),
            getUsers({ limit: 1 }),
            getLogs({ limit: 5 }),
          ]);

          setStats(prev => ({
            ...prev,
            totalProperties: propsRes.status === 'fulfilled' ? propsRes.value.data.pagination?.totalCount || 0 : 0,
            pendingRequests: reqsRes.status === 'fulfilled' ? reqsRes.value.data.pagination?.totalCount || 0 : 0,
            totalUsers: usersRes.status === 'fulfilled' ? usersRes.value.data.pagination?.totalCount || 0 : 0,
          }));

          if (logsRes.status === 'fulfilled') {
            setRecentData(logsRes.value.data.data || []);
          }
        } else if (isDeptHead) {
          const [propsRes, pendingRes, approvedRes, reviewRes, recentRes] = await Promise.allSettled([
            getProperties({ limit: 1 }),
            getMyRequests({ status: 'في الانتظار', limit: 1 }),
            getMyRequests({ status: 'مقبول', limit: 1 }),
            getRequests({ status: 'في الانتظار', limit: 1 }),
            getMyRequests({ limit: 5 }),
          ]);

          setStats(prev => ({
            ...prev,
            totalProperties: propsRes.status === 'fulfilled' ? propsRes.value.data.pagination?.totalCount || 0 : 0,
            myPending: pendingRes.status === 'fulfilled' ? pendingRes.value.data.pagination?.totalCount || 0 : 0,
            myApproved: approvedRes.status === 'fulfilled' ? approvedRes.value.data.pagination?.totalCount || 0 : 0,
            pendingRequests: reviewRes.status === 'fulfilled' ? reviewRes.value.data.pagination?.totalCount || 0 : 0,
          }));

          if (recentRes.status === 'fulfilled') {
            setRecentData(recentRes.value.data.data || []);
          }
        } else {
          const [propsRes, pendingRes, approvedRes, recentRes] = await Promise.allSettled([
            getProperties({ limit: 1 }),
            getMyRequests({ status: 'في الانتظار', limit: 1 }),
            getMyRequests({ status: 'مقبول', limit: 1 }),
            getMyRequests({ limit: 5 }),
          ]);

          setStats(prev => ({
            ...prev,
            totalProperties: propsRes.status === 'fulfilled' ? propsRes.value.data.pagination?.totalCount || 0 : 0,
            myPending: pendingRes.status === 'fulfilled' ? pendingRes.value.data.pagination?.totalCount || 0 : 0,
            myApproved: approvedRes.status === 'fulfilled' ? approvedRes.value.data.pagination?.totalCount || 0 : 0,
          }));

          if (recentRes.status === 'fulfilled') {
            setRecentData(recentRes.value.data.data || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin, isDeptHead]);

  if (loading) return <Spinner fullScreen />;

  const adminCards = [
    { label: 'إجمالي العقارات', value: stats.totalProperties, icon: FiFileText, color: 'bg-blue-500', path: '/properties' },
    { label: 'طلبات معلقة', value: stats.pendingRequests, icon: FiSend, color: 'bg-yellow-500', path: '/requests' },
    { label: 'المستخدمين', value: stats.totalUsers, icon: FiUsers, color: 'bg-green-500', path: '/users' },
  ];

  const deptHeadCards = [
    { label: 'إجمالي الملفات العقارية', value: stats.totalProperties, icon: FiFileText, color: 'bg-blue-500', path: '/properties' },
    { label: 'طلباتي المعلقة', value: stats.myPending, icon: FiActivity, color: 'bg-yellow-500', path: '/requests' },
    { label: 'طلباتي المقبولة', value: stats.myApproved, icon: FiSend, color: 'bg-green-500', path: '/requests' },
    { label: 'طلبات معلقة للمراجعة', value: stats.pendingRequests, icon: FiSend, color: 'bg-purple-500', path: '/requests' },
  ];

  const employeeCards = [
    { label: 'إجمالي الملفات العقارية', value: stats.totalProperties, icon: FiFileText, color: 'bg-blue-500', path: '/properties' },
    { label: 'طلباتي المعلقة', value: stats.myPending, icon: FiActivity, color: 'bg-yellow-500', path: '/requests' },
    { label: 'طلباتي المقبولة', value: stats.myApproved, icon: FiSend, color: 'bg-green-500', path: '/requests' },
  ];

  const cards = isAdmin ? adminCards : (isDeptHead ? deptHeadCards : employeeCards);

  const logColumns = [
    { key: 'action', label: 'الإجراء', render: (row) => <Badge status={row.action} /> },
    { key: 'target', label: 'الهدف', render: (row) => (
      row.target ? <span className="text-primary font-bold">{row.target}</span> : <span className="text-gray-300">-</span>
    )},
    { key: 'username', label: 'المستخدم' },
    { key: 'time', label: 'الوقت', render: (row) => formatDate(row.time) },
  ];

  const requestColumns = [
    { key: 'request_id', label: 'رقم الطلب' },
    { key: 'property_file_number', label: 'رقم الملف' },
    { key: 'request_type', label: 'النوع' },
    { key: 'status', label: 'الحالة', render: (row) => <Badge status={row.status} /> },
    { key: 'created_at', label: 'التاريخ', render: (row) => formatDate(row.created_at) },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">مرحباً، {user?.firstName}</h1>
        <p className="text-gray-500 text-lg mt-2">نظرة عامة على النظام اليوم</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards.map((card, index) => (
          <div 
            key={index} 
            onClick={() => navigate(card.path)}
            className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex items-center gap-6 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200 group"
          >
            <div className={`${card.color} p-5 rounded-lg text-white shadow-lg group-hover:scale-110 transition-transform duration-200`}>
              <card.icon size={28} />
            </div>
            <div>
              <p className="text-base text-gray-500 font-medium">{card.label}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-8">
          {isAdmin ? 'آخر النشاطات في النظام' : 'آخر طلباتي'}
        </h2>
        <DataTable
          columns={isAdmin ? logColumns : requestColumns}
          data={recentData}
          emptyMessage={isAdmin ? 'لا توجد سجلات حالياً' : 'لم تقم بتقديم أي طلبات بعد'}
        />
      </div>
    </div>
  );
};

export default Dashboard;
