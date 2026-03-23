import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { loginApi } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // Redirect if already authenticated
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'اسم المستخدم مطلوب';
    if (!password) newErrors.password = 'كلمة المرور مطلوبة';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const data = await loginApi(username, password);
      login(data);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'حدث خطأ في تسجيل الدخول';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark to-primary p-4">
      <div className="bg-surface rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏛️</span>
          </div>
          <h1 className="text-2xl font-bold text-text">نظام إدارة الملفات العقارية</h1>
          <p className="text-text-light text-sm mt-1">هيئة التسجيل العقاري</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            id="username"
            label="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={errors.username}
            autoFocus
          />
          <Input
            id="password"
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Button type="submit" loading={loading} className="w-full mt-4">
            تسجيل الدخول
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
