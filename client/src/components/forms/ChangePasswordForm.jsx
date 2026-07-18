import { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { changePasswordApi } from '../../api/authApi';
import { toast } from 'react-hot-toast';

const ChangePasswordForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'اسم المستخدم مطلوب';
    if (!formData.currentPassword) newErrors.currentPassword = 'كلمة المرور الحالية مطلوبة';
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'كلمة المرور الجديدة مطلوبة';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'كلمة المرور يجب أن تكون 8 خانات على الأقل';
    } else if (!/[A-Z]/.test(formData.newPassword)) {
      newErrors.newPassword = 'يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل';
    } else if (!/[0-9]/.test(formData.newPassword)) {
      newErrors.newPassword = 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل';
    } else if (!/[^A-Za-z0-9]/.test(formData.newPassword)) {
      newErrors.newPassword = 'يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور الجديدة مطلوب';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمتا المرور الجديدتان غير متطابقتين';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await changePasswordApi(
        formData.username,
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );
      toast.success('تم تغيير كلمة المرور بنجاح');
      if (onSuccess) onSuccess();
    } catch (error) {
      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach((err) => {
          const fieldName = err.field.replace('body.', '');
          serverErrors[fieldName] = err.message;
        });
        setErrors(serverErrors);
        toast.error(error.response.data.message || 'خطأ في التحقق من البيانات');
      } else {
        toast.error(error.response?.data?.message || 'حدث خطأ ما');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="اسم المستخدم"
        name="username"
        value={formData.username}
        onChange={handleChange}
        error={errors.username}
        required
        autoFocus
      />
      <Input
        label="كلمة المرور الحالية"
        name="currentPassword"
        type="password"
        value={formData.currentPassword}
        onChange={handleChange}
        error={errors.currentPassword}
        required
      />
      <div>
        <Input
          label="كلمة المرور الجديدة"
          name="newPassword"
          type="password"
          value={formData.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          required
        />
        <p className="text-xs text-gray-500 -mt-4 mb-4">
          يجب أن تحتوي على 8 خانات على الأقل، تشمل حرفاً كبيراً، رقماً، ورمزاً خاصاً.
        </p>
      </div>
      <Input
        label="تأكيد كلمة المرور الجديدة"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        required
      />

      <div className="flex gap-3 justify-end mt-8 border-t border-gray-100 pt-6">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          إلغاء
        </Button>
        <Button type="submit" loading={loading}>
          تغيير كلمة المرور
        </Button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
