import { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import ImageUploader from '../common/ImageUploader';
import { submitRequest } from '../../api/requestApi';
import { toast } from 'react-hot-toast';
import { PROPERTY_STATUS } from '../../constants';

const EditRequestForm = ({ property, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    propertyFileNumber: property?.property_file_number || '',
    ownerName: property?.owner_name || '',
    nationalNumber: property?.national_number || '',
    location: property?.location || '',
    area: property?.area || '',
    status: property?.status || 'مؤقت',
    requestDescription: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.ownerName || formData.ownerName.length < 3) newErrors.ownerName = 'اسم المالك يجب أن يكون 3 حروف على الأقل';
    if (!formData.nationalNumber || String(formData.nationalNumber).length !== 12) newErrors.nationalNumber = 'الرقم الوطني يجب أن يكون 12 رقم';
    if (!formData.location) newErrors.location = 'الموقع مطلوب';
    if (!formData.area) newErrors.area = 'المساحة مطلوبة';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const requestData = {
      propertyFileNumber: parseInt(formData.propertyFileNumber, 10),
      requestType: 'تعديل',
      requestDescription: formData.requestDescription,
      newData: {
        ownerName: formData.ownerName,
        nationalNumber: parseInt(formData.nationalNumber, 10),
        location: formData.location,
        area: formData.area,
        status: formData.status
      }
    };

    setLoading(true);
    try {
      let payload;

      if (selectedImages.length > 0) {
        // Build FormData when images are attached
        payload = new FormData();
        payload.append('propertyFileNumber', requestData.propertyFileNumber);
        payload.append('requestType', requestData.requestType);
        payload.append('requestDescription', requestData.requestDescription);
        payload.append('newData', JSON.stringify(requestData.newData));
        selectedImages.forEach(file => payload.append('images', file));
      } else {
        payload = requestData;
      }

      await submitRequest(payload);
      toast.success('تم تقديم طلب التعديل بنجاح');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ ما أثناء إرسال الطلب');
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
          disabled={true}
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
          type="number"
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
          <label >الحالة</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="block w-full px-4 py-3 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
          >
            <option value={PROPERTY_STATUS.TEMPORARY}>مؤقت</option>
            <option value={PROPERTY_STATUS.CERTIFIED}>مصدق</option>
            <option value={PROPERTY_STATUS.RESERVED}>محجوز</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-text mb-1">وصف التعديل</label>
        <textarea
          name="requestDescription"
          value={formData.requestDescription}
          onChange={handleChange}
          placeholder="اشرح سبب التعديل أو التغييرات التي أجريتها (اختياري)..."
          className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all duration-200 min-h-[100px] ${errors.requestDescription
            ? 'border-danger focus:ring-danger/30'
            : 'border-border focus:ring-accent/30 focus:border-accent'
            }`}
        ></textarea>
        {errors.requestDescription && <p className="mt-1 text-xs text-danger">{errors.requestDescription}</p>}
      </div>

      {/* Image Upload Section */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-bold text-gray-700 mb-3">إرفاق صور (اختياري)</h3>
        <ImageUploader onFilesSelected={setSelectedImages} />
      </div>

      <div className="flex gap-3 justify-end mt-8 border-t border-gray-100 pt-6">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          إلغاء
        </Button>
        <Button type="submit" loading={loading}>
          تقديم طلب التعديل
        </Button>
      </div>
    </form>
  );
};

export default EditRequestForm;
