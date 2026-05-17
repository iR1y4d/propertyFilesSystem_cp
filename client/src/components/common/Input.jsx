const Input = ({ label, error, id, type = 'text', ...props }) => {
  return (
    <div className="mb-6">
      {label && (
        <label htmlFor={id} className="block text-base font-medium text-text mb-2">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`w-full px-5 py-3.5 border rounded-lg text-base focus:outline-none focus:ring-2 transition-all duration-200 ${
          error
            ? 'border-danger focus:ring-danger/30'
            : 'border-border focus:ring-accent/30 focus:border-accent'
        }`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
};

export default Input;
