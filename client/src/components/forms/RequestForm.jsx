import { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import ImageUploader from '../common/ImageUploader';
import { submitRequest } from '../../api/requestApi';
import { toast } from 'react-hot-toast';
// No status constants needed here as they are strings in the JSX

const RequestForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    propertyFileNumber: '',
    requestType: 'تعديل',
    requestDescription: '',
    newData: {
      ownerName: '',
      nationalNumber: '',
      location: '',
      area: '',
      status: 'مؤقت',
    },
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('newData.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        newData: { ...prev.newData, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.propertyFileNumber) newErrors.propertyFileNumber = 'رقم الملف مطلوب';
    if (!formData.requestDescription) newErrors.requestDescription = 'وصف الطلب مطلوب';
    
    if (formData.requestType === 'إضافة' || formData.requestType === 'تعديل') {
      if (!formData.newData.ownerName) newErrors.ownerName = 'اسم المالك مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      let payload;

      if (selectedImages.length > 0) {
        // Build FormData when images are attached
        payload = new FormData();
        payload.append('propertyFileNumber', parseInt(formData.propertyFileNumber, 10));
        payload.append('requestType', formData.requestType);
        payload.append('requestDescription', formData.requestDescription);
        payload.append('newData', JSON.stringify(formData.newData));
        selectedImages.forEach(file => payload.append('images', file));
      } else {
        // Plain JSON when no images
        payload = {
          ...formData,
          propertyFileNumber: parseInt(formData.propertyFileNumber, 10),
        };
      }

      await submitRequest(payload);
      toast.success('تم تقديم الطلب بنجاح وهو الآن في انتظار موافقة المسؤول');
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
          label="رقم الملف العقاري"
          name="propertyFileNumber"
          type="number"
          value={formData.propertyFileNumber}
          onChange={handleChange}
          error={errors.propertyFileNumber}
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">نوع الطلب</label>
          <select
            name="requestType"
            value={formData.requestType}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm bg-white"
          >
            <option value="إضافة">إضافة</option>
            <option value="تعديل">تعديل</option>
            <option value="حذف">حذف</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">وصف الطلب / مبرر التعديل</label>
        <textarea
          name="requestDescription"
          value={formData.requestDescription}
          onChange={handleChange}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
          placeholder="مثلاً: تحديث اسم المالك بعد عملية البيع..."
        />
        {errors.requestDescription && <p className="text-xs text-red-500">{errors.requestDescription}</p>}
      </div>

      {(formData.requestType === 'إضافة' || formData.requestType === 'تعديل') && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-bold text-gray-800 mb-4">البيانات المقترحة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="اسم المالك الجديد"
              name="newData.ownerName"
              value={formData.newData.ownerName}
              onChange={handleChange}
              error={errors.ownerName}
            />
            <Input
              label="الرقم الوطني"
              name="newData.nationalNumber"
              value={formData.newData.nationalNumber}
              onChange={handleChange}
            />
            <Input
              label="الموقع"
              name="newData.location"
              value={formData.newData.location}
              onChange={handleChange}
            />
            <Input
              label="المساحة"
              name="newData.area"
              value={formData.newData.area}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {/* Image Upload — available for إضافة and تعديل */}
      {(formData.requestType === 'إضافة' || formData.requestType === 'تعديل') && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-bold text-gray-800 mb-3">صور العقار (اختياري)</h3>
          <ImageUploader onFilesSelected={setSelectedImages} />
        </div>
      )}

      <div className="flex gap-3 justify-end mt-8 border-t border-gray-100 pt-6">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          إلغاء
        </Button>
        <Button type="submit" loading={loading}>
          تقديم الطلب
        </Button>
      </div>
    </form>
  );
};

export default RequestForm;
