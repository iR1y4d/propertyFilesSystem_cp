const Input = ({ label, error, id, type = 'text', ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
          error
            ? 'border-danger focus:ring-danger/30'
            : 'border-border focus:ring-accent/30 focus:border-accent'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
};

export default Input;
