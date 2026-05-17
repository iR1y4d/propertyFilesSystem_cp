import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AppLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto bg-bg">
        <div className="p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
