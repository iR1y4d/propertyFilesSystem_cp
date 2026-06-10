import { useState } from 'react';
import { FiDownload, FiFileText, FiList, FiPrinter } from 'react-icons/fi';
import { exportProperties, exportLogs, getFormFile } from '../api/reportApi';
import { downloadBlob, printPdfBlob } from '../utils/helpers';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { ROLES, PRINTABLE_FORMS } from '../constants';
import Button from '../components/common/Button';


const FormCard = ({ form, onPrint, isPrinting }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
    <div>
      <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center text-primary mb-4">
        <form.icon size={24} />
      </div>
      <h3 className="text-xl font-bold text-gray-800">{form.name}</h3>
      <p className="text-sm text-gray-500 mt-2 mb-6">{form.description}</p>
    </div>
    <button 
      onClick={() => onPrint(form.filename)}
      disabled={isPrinting}
      className="inline-flex justify-center items-center gap-2 w-full py-3 px-4 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      <FiPrinter />
      {isPrinting ? 'جاري التحضير...' : 'طباعة النموذج'}
    </button>
  </div>
);

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

  const [printingFilename, setPrintingFilename] = useState(null);

  const handlePrintForm = async (filename) => {
    setPrintingFilename(filename);
    try {
      const response = await getFormFile(filename);
      printPdfBlob(response.data);
      toast.success('تمت تهيئة الطباعة بنجاح');
    } catch (error) {
      toast.error('فشل تحميل النموذج للطباعة. يرجى المحاولة لاحقاً.');
      console.error(error);
    } finally {
      setPrintingFilename(null);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">التقارير</h1>
        <p className="text-gray-500 text-lg mt-2">تصدير البيانات إلى ملفات PDF أو Excel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Properties Report */}
        <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-5 text-primary">
            <div className="bg-primary/10 p-4 rounded-lg text-primary">
              <FiFileText size={28} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">تقرير العقارات</h2>
          </div>
          <p className="text-base text-gray-500 leading-relaxed">
            يحتوي هذا التقرير على قائمة كاملة بجميع العقارات المسجلة في النظام مع تفاصيل المالك والموقع والمساحة والحالة الحالية.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
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
          <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center gap-5 text-primary">
              <div className="bg-primary/10 p-4 rounded-lg text-primary">
                <FiList size={28} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">تقرير سجل التدقيق</h2>
            </div>
            <p className="text-base text-gray-500 leading-relaxed">
              تقرير مفصل بجميع الحركات التي تمت على النظام، بما في ذلك بيانات المستخدمين، التواريخ، والعمليات التي قاموا بها.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
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

      {/* Printable Forms Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">نماذج للطباعة</h2>
        <p className="text-gray-500 text-base mb-8">
          نماذج جاهزة للطباعة يمكن للمواطنين تعبئتها
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRINTABLE_FORMS.map((form, index) => (
            <FormCard 
              key={index} 
              form={form} 
              onPrint={handlePrintForm}
              isPrinting={printingFilename === form.filename}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
