const Spinner = ({ fullScreen = false }) => {
  const spinner = (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
    </div>
  );

  if (fullScreen) {
    return <div className="fixed inset-0 flex items-center justify-center bg-bg/80 z-50">{spinner}</div>;
  }

  return spinner;
};

export default Spinner;
