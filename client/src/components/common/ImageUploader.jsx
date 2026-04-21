import { useState, useRef } from 'react';
import { FiUploadCloud, FiX, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ImageUploader = ({ onFilesSelected, maxFiles = 500, maxSizeMB = 50 }) => {
  const [previews, setPreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const validateAndAddFiles = (fileList) => {
    const newFiles = Array.from(fileList);
    const validFiles = [];
    const errors = [];

    for (const file of newFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: نوع غير مدعوم`);
        continue;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        errors.push(`${file.name}: حجم الملف أكبر من ${maxSizeMB}MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (errors.length > 0) {
      toast.error(errors.join('\n'), { duration: 4000 });
    }

    const totalFiles = previews.length + validFiles.length;
    if (totalFiles > maxFiles) {
      toast.error(`الحد الأقصى ${maxFiles} ملف. تم اختيار ${totalFiles} ملفات.`);
      return;
    }

    if (validFiles.length === 0) return;

    const newPreviews = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));

    const allPreviews = [...previews, ...newPreviews];
    setPreviews(allPreviews);
    onFilesSelected(allPreviews.map(p => p.file));
  };

  const removeFile = (index) => {
    const updated = previews.filter((_, i) => i !== index);
    // Revoke the old preview URL
    URL.revokeObjectURL(previews[index].url);
    setPreviews(updated);
    onFilesSelected(updated.map(p => p.file));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <FiUploadCloud className={`mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} size={36} />
        <p className="text-sm font-medium text-gray-600 mb-1">
          اسحب الصور هنا أو اضغط للاختيار
        </p>
        <p className="text-xs text-gray-400">
          JPG, PNG, WEBP — حد أقصى {maxSizeMB}MB للملف
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Selected files count */}
      {previews.length > 0 && (
        <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
          <FiAlertCircle className="text-blue-500" size={14} />
          <span>تم اختيار {previews.length} صورة</span>
        </div>
      )}

      {/* Previews grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-3">
          {previews.map((p, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img
                src={p.url}
                alt={p.name}
                className="w-full h-full object-cover"
              />
              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="إزالة"
              >
                <FiX size={12} />
              </button>
              {/* Filename tooltip */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {p.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
