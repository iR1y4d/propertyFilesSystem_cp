import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants';
import { FiHome, FiFileText, FiSend, FiUsers, FiList, FiBarChart2, FiLogOut } from 'react-icons/fi';

const navItems = [
  { to: '/', label: 'لوحة التحكم', icon: FiHome, roles: [ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD] },
  { to: '/properties', label: 'العقارات', icon: FiFileText, roles: [ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD] },
  { to: '/requests', label: 'الطلبات', icon: FiSend, roles: [ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD] },
  { to: '/users', label: 'المستخدمين', icon: FiUsers, roles: [ROLES.ADMIN] },
  { to: '/logs', label: 'سجل التدقيق', icon: FiList, roles: [ROLES.ADMIN] },
  { to: '/reports', label: 'التقارير', icon: FiBarChart2, roles: [ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="h-screen w-72 text-white flex flex-col gap-10 sticky top-0 flex-shrink-0 z-40 ">
      {/* Logo Area */}
      <div className="p-8 border-b border-white/10 text-center">
        {/* <h1 className="text-3xl font-bold py-4 leading-snug">إدارة الملفات العقارية</h1> */}
        <img src="logo.png" alt="" />
        <p className="text-sm text-gray-400 mt-2">هيئة التسجيل العقاري</p>
      </div>

      {/* Navigation */}
      <nav className=" overflow-y-hidden">
        {navItems
          .filter(item => item.roles.includes(user?.role))
          .map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-4 px-8 py-4 text-lg transition-colors ${isActive
                  ? 'bg-primary text-white border-r-4 border-accent-light'
                  : 'text-[#555555] hover:bg-white/5 hover:text-primary'
                }`
              }
            >
              <item.icon size={22} />
              {item.label}
            </NavLink>
          ))}
      </nav>

      {/* User Info + Logout */}
      <div className="p-8 border-t border-gray-400 text-[#555]">
        <div className="text-base mb-4">
          <p className="font-medium text-lg">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-gray-400 mt-1">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 text-base text-red-400 hover:text-red-300 transition-colors w-full cursor-pointer"
        >
          <FiLogOut size={20} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
