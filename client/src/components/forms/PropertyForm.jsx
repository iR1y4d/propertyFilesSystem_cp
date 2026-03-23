import { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { createProperty, updateProperty } from '../../api/propertyApi';
import { toast } from 'react-hot-toast';
import { PROPERTY_STATUS } from '../../constants';

const PropertyForm = ({ initialData, onSuccess, onCancel }) => {
  const isEdit = !!initialData;
  const [formData, setFormData] = useState({
    propertyFileNumber: initialData?.property_file_number || '',
    ownerName: initialData?.owner_name || '',
    nationalNumber: initialData?.national_number || '',
    location: initialData?.location || '',
    area: initialData?.area || '',
    status: initialData?.status || 'مؤقت',
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
    if (!formData.propertyFileNumber) newErrors.propertyFileNumber = 'رقم الملف مطلوب';
    if (!formData.ownerName || formData.ownerName.length < 3) newErrors.ownerName = 'اسم المالك يجب أن يكون 3 حروف على الأقل';
    if (!formData.nationalNumber || formData.nationalNumber.length !== 10) newErrors.nationalNumber = 'الرقم الوطني يجب أن يكون 10 أرقام';
    if (!formData.location) newErrors.location = 'الموقع مطلوب';
    if (!formData.area) newErrors.area = 'المساحة مطلوبة';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...formData,
      propertyFileNumber: parseInt(formData.propertyFileNumber, 10),
      nationalNumber: parseInt(formData.nationalNumber, 10),
    };

    setLoading(true);
    try {
      if (isEdit) {
        await updateProperty(initialData.property_file_number, payload);
        toast.success('تم تحديث بيانات العقار بنجاح');
      } else {
        await createProperty(payload);
        toast.success('تم إضافة العقار بنجاح');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="رقم الملف"
          name="propertyFileNumber"
          type="number"
          value={formData.propertyFileNumber}
          onChange={handleChange}
          error={errors.propertyFileNumber}
          disabled={isEdit}
          required
        />
        <Input
          label="اسم المالك"
          name="ownerName"
          value={formData.ownerName}
          onChange={handleChange}
          error={errors.ownerName}
          required
        />
        <Input
          label="الرقم الوطني"
          name="nationalNumber"
          value={formData.nationalNumber}
          onChange={handleChange}
          error={errors.nationalNumber}
          required
        />
        <Input
          label="الموقع"
          name="location"
          value={formData.location}
          onChange={handleChange}
          error={errors.location}
          required
        />
        <Input
          label="المساحة"
          name="area"
          value={formData.area}
          onChange={handleChange}
          error={errors.area}
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">الحالة</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm bg-white"
          >
            <option value={PROPERTY_STATUS.TEMPORARY}>مؤقت</option>
            <option value={PROPERTY_STATUS.CERTIFIED}>مصدق</option>
            <option value={PROPERTY_STATUS.RESERVED}>محجوز</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-8 border-t border-gray-100 pt-6">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          إلغاء
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'تحديث البيانات' : 'إضافة العقار'}
        </Button>
      </div>
    </form>
  );
};

export default PropertyForm;
