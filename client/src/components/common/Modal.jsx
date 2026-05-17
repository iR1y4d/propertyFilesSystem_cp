import Button from './Button';

const Modal = ({ isOpen, title, message, children, onConfirm, onClose, onCancel, confirmText = 'تأكيد', cancelText = 'إلغاء', variant = 'danger', loading = false }) => {
  if (!isOpen) return null;

  const handleCancel = onClose || onCancel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
        <h3 className="text-xl font-bold text-text mb-3">{title}</h3>
        {message && <p className="text-text-light text-base mb-6 leading-relaxed">{message}</p>}
        {children && <div className="mb-8">{children}</div>}
        <div className="flex gap-4 justify-end mt-4">
          <Button variant="ghost" onClick={handleCancel}>{cancelText}</Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
