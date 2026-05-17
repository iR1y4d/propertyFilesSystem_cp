import { STATUS_COLORS } from '../../constants';

const Badge = ({ status }) => {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

  return (
    <span
      className={`inline-flex items-center px-3.5 py-1 rounded-full text-sm font-medium ${colorClass}`}
    >
      {status}
    </span>
  );
};

export default Badge;
