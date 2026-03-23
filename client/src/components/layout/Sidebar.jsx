import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants';
import { FiHome, FiFileText, FiSend, FiUsers, FiList, FiBarChart2, FiLogOut } from 'react-icons/fi';

const navItems = [
  { to: '/', label: 'لوحة التحكم', icon: FiHome, roles: [ROLES.ADMIN, ROLES.EMPLOYEE] },
  { to: '/properties', label: 'العقارات', icon: FiFileText, roles: [ROLES.ADMIN, ROLES.EMPLOYEE] },
  { to: '/requests', label: 'الطلبات', icon: FiSend, roles: [ROLES.ADMIN, ROLES.EMPLOYEE] },
  { to: '/users', label: 'المستخدمين', icon: FiUsers, roles: [ROLES.ADMIN] },
  { to: '/logs', label: 'سجل التدقيق', icon: FiList, roles: [ROLES.ADMIN] },
  { to: '/reports', label: 'التقارير', icon: FiBarChart2, roles: [ROLES.ADMIN, ROLES.EMPLOYEE] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="h-screen w-64 bg-sidebar text-white flex flex-col sticky top-0 flex-shrink-0 z-40">
      {/* Logo Area */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-lg font-bold">إدارة الملفات العقارية</h1>
        <p className="text-xs text-gray-400 mt-1">هيئة التسجيل العقاري</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems
          .filter(item => item.roles.includes(user?.role))
          .map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-white border-r-4 border-accent-light'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
      </nav>

      {/* User Info + Logout */}
      <div className="p-4 border-t border-white/10">
        <div className="text-sm mb-3">
          <p className="font-medium">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-gray-400">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors w-full cursor-pointer"
        >
          <FiLogOut size={16} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
