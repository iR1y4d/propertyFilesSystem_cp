import { useAuth } from '../../hooks/useAuth';

const Header = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="bg-surface border-b border-border px-10 py-6 flex items-center justify-between">
      <h2 className="text-2xl font-bold text-text">{title}</h2>
      <div className="flex items-center gap-4">
        <span className="text-base text-text-light">
          مرحباً، {user?.firstName}
        </span>
        <span className="bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full">
          {user?.role}
        </span>
      </div>
    </header>
  );
};

export default Header;
