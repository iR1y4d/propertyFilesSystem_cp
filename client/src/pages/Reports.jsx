import { useState } from 'react';
import { FiDownload, FiFileText, FiList } from 'react-icons/fi';
import { exportProperties, exportLogs } from '../api/reportApi';
import { downloadBlob } from '../utils/helpers';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants';
import Button from '../components/common/Button';

const Reports = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const [loading, setLoading] = useState({
    propPdf: false,
    propExcel: false,
    logPdf: false,
    logExcel: false,
  });

  const handleExport = async (type, format) => {
    const key = `${type}${format.charAt(0).toUpperCase() + format.slice(1)}`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const apiFn = type === 'prop' ? exportProperties : exportLogs;
      const response = await apiFn(format);
      
      const filename = `${type === 'prop' ? 'properties' : 'audit_logs'}_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      downloadBlob(response.data, filename);
      toast.success('تم إنشاء التقرير وتحميله بنجاح');
    } catch (error) {
      toast.error('فشل إنشاء التقرير. يرجى المحاولة لاحقاً.');
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">التقارير</h1>
        <p className="text-gray-500">تصدير البيانات إلى ملفات PDF أو Excel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Properties Report */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-4 text-primary">
            <div className="bg-primary/10 p-3 rounded-lg text-primary">
              <FiFileText size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">تقرير العقارات</h2>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            يحتوي هذا التقرير على قائمة كاملة بجميع العقارات المسجلة في النظام مع تفاصيل المالك والموقع والمساحة والحالة الحالية.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              className="flex-1" 
              onClick={() => handleExport('prop', 'pdf')}
              loading={loading.propPdf}
            >
              <FiDownload className="ml-2" />
              تصدير PDF
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1" 
              onClick={() => handleExport('prop', 'excel')}
              loading={loading.propExcel}
            >
              <FiDownload className="ml-2" />
              تصدير Excel
            </Button>
          </div>
        </div>

        {/* Logs Report - Admin Only */}
        {isAdmin && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center gap-4 text-primary">
              <div className="bg-primary/10 p-3 rounded-lg text-primary">
                <FiList size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">تقرير سجل التدقيق</h2>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              تقرير مفصل بجميع الحركات التي تمت على النظام، بما في ذلك بيانات المستخدمين، التواريخ، والعمليات التي قاموا بها.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                className="flex-1" 
                onClick={() => handleExport('log', 'pdf')}
                loading={loading.logPdf}
              >
                <FiDownload className="ml-2" />
                تصدير PDF
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={() => handleExport('log', 'excel')}
                loading={loading.logExcel}
              >
                <FiDownload className="ml-2" />
                تصدير Excel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
