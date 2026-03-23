import { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';

const SearchBar = ({ value, onChange, placeholder = 'بحث...' }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(handler);
  }, [localValue, onChange]);

  return (
    <div className="relative flex-1 max-w-md">
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <FiSearch className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-all shadow-sm"
        placeholder={placeholder}
      />
    </div>
  );
};

export default SearchBar;
