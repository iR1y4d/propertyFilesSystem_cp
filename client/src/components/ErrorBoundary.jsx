import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('⚠️ [Client Crash] Error Boundary caught an uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          fontFamily: 'Cairo, system-ui, sans-serif',
          padding: '2rem',
          direction: 'rtl',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '500px',
            backgroundColor: '#1e293b',
            borderRadius: '1rem',
            padding: '2.5rem',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
            border: '1px solid #c69c36'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem'
            }}>⚠️</div>
            
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#c69c36',
              marginBottom: '1rem'
            }}>حدث خطأ غير متوقع في النظام</h1>
            
            <p style={{
              color: '#94a3b8',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '2rem'
            }}>
              عذراً، واجه التطبيق خطأً غير متوقع ومنع تحميل الصفحة. لقد تم تسجيل تفاصيل الخطأ للتدقيق.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={this.handleReset}
                style={{
                  backgroundColor: '#c69c36',
                  color: '#1e293b',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  outline: 'none'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#b08b2d'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#c69c36'}
              >
                العودة للصفحة الرئيسية
              </button>
              
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  outline: 'none'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#475569'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#334155'}
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
