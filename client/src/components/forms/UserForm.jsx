import { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { createUser, updateUser } from '../../api/userApi';
import { toast } from 'react-hot-toast';
import { ROLES } from '../../constants';

const UserForm = ({ initialData, onSuccess, onCancel }) => {
  const isEdit = !!initialData;
  const [formData, setFormData] = useState({
    firstName: initialData?.first_name || '',
    lastName: initialData?.last_name || '',
    username: initialData?.username || '',
    password: '',
    role: initialData?.role || ROLES.EMPLOYEE,
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
    if (!formData.firstName) newErrors.firstName = 'الاسم الأول مطلوب';
    if (!formData.lastName) newErrors.lastName = 'الاسم الأخير مطلوب';
    if (!formData.username || formData.username.length < 3) newErrors.username = 'اسم المستخدم قصير جداً';
    if (!isEdit) {
      if (!formData.password) {
        newErrors.password = 'كلمة المرور مطلوبة';
      } else if (formData.password.length < 8) {
        newErrors.password = 'كلمة المرور يجب أن تكون 8 خانات على الأقل';
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = 'يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل';
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل';
      } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
        newErrors.password = 'يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await updateUser(initialData.user_id, formData);
        toast.success('تم تحديث المستخدم بنجاح');
      } else {
        await createUser(formData);
        toast.success('تم إنشاء حساب المستخدم بنجاح');
      }
      onSuccess();
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="الاسم الأول"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          error={errors.firstName}
          required
        />
        <Input
          label="الاسم الأخير"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          error={errors.lastName}
          required
        />
        <Input
          label="اسم المستخدم"
          name="username"
          value={formData.username}
          onChange={handleChange}
          error={errors.username}
          disabled={isEdit}
          required
        />
        {!isEdit && (
          <div>
            <Input
              label="كلمة المرور"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />
            <p className="text-xs text-gray-500 -mt-4 mb-4">
              يجب أن تحتوي على 8 خانات على الأقل، تشمل حرفاً كبيراً، رقماً، ورمزاً خاصاً.
            </p>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label>الدور</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary  bg-white"
          >
            <option value={ROLES.EMPLOYEE}>موظف</option>
            <option value={ROLES.ADMIN}>مدير</option>
            <option value={ROLES.DEPARTMENT_HEAD}>رئيس قسم</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-8 border-t border-gray-100 pt-6">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          إلغاء
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'تحديث البيانات' : 'إنشاء الحساب'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
