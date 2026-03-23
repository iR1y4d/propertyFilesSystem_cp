import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-xl text-text-light mb-8">الصفحة المطلوبة غير موجودة</p>
      <Link to="/">
        <Button>العودة للرئيسية</Button>
      </Link>
    </div>
  );
};

export default NotFound;
