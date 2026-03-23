const variants = {
  primary: 'bg-primary text-white hover:bg-primary-light',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200',
  danger: 'bg-danger text-white hover:bg-red-600',
  outline: 'border border-primary text-primary hover:bg-primary hover:text-white',
  ghost: 'text-text-light hover:bg-gray-100'
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
};

const Button = ({ children, variant = 'primary', size = 'md', disabled, loading, className = '', ...props }) => {
  return (
    <button
      className={`rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
      {children}
    </button>
  );
};

export default Button;
