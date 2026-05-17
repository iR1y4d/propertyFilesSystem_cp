import { useState, useEffect, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';

const SearchBar = ({ value, onChange, placeholder = 'بحث...' }) => {
  const [localValue, setLocalValue] = useState(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    // Skip the initial mount to avoid resetting pagination
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const handler = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(handler);
  }, [localValue, onChange]);

  return (
    <div className="flex flex-1 max-w-lg items-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-1 shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all overflow-hidden">
      <FiSearch className="h-5 w-5 text-gray-400 shrink-0" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="flex-1 w-full py-3 bg-transparent placeholder-gray-500 focus:outline-none focus:ring-0 border-transparent text-base leading-6 m-0 p-0"
        placeholder={placeholder}
      />
    </div>
  );
};

export default SearchBar;
