import Button from './Button';

const Modal = ({ isOpen, title, message, onConfirm, onClose, onCancel, confirmText = 'تأكيد', cancelText = 'إلغاء', variant = 'danger', loading = false }) => {
  if (!isOpen) return null;

  const handleCancel = onClose || onCancel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold text-text mb-2">{title}</h3>
        <p className="text-text-light mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={handleCancel}>{cancelText}</Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
