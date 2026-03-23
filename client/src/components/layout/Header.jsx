import { useAuth } from '../../hooks/useAuth';

const Header = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="bg-surface border-b border-border px-8 py-4 flex items-center justify-between">
      <h2 className="text-xl font-bold text-text">{title}</h2>
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-light">
          مرحباً، {user?.firstName}
        </span>
        <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
          {user?.role}
        </span>
      </div>
    </header>
  );
};

export default Header;
