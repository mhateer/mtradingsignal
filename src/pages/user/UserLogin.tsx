import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { loginUser } from '../../api/userAuth';
import { useUserAuthStore } from '../../store/userAuthStore';
import toast from 'react-hot-toast';

interface LoginForm {
  email: string;
  password: string;
}

const inputStyle = {
  width: '100%', padding: '10px 14px',
  border: '0.5px solid #DDD6C4', borderRadius: '6px',
  fontFamily: 'EB Garamond, serif', fontSize: '15px',
  background: '#FAF7F2', color: '#1C2B1A', outline: 'none',
};

const labelStyle = {
  display: 'block', fontSize: '11px', color: '#8a7e6a',
  letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '8px',
};

export default function UserLogin() {
  const navigate = useNavigate();
  const { login } = useUserAuthStore();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await loginUser(data.email, data.password);
      login(res.accessToken, res.user);
      toast.success('Welcome back.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/mts-logo.png" alt="mTradingSignal"
            style={{
              width: '100px', height: '100px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px'
            }}></img>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0', letterSpacing: '1px' }}>
            TRADE INTELLIGENCE PLATFORM
          </p>
        </div>

        <div style={{ background: '#fff', border: '0.5px solid #DDD6C4', borderRadius: '10px', padding: '36px' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '20px', color: 'var(--green-deep)', margin: '0 0 24px' }}>
                Sign In
              </h2>
          <form onSubmit={handleSubmit(onSubmit)}> 
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Email Address</label>
              <input {...register('email', { required: 'Email is required' })} type="email" placeholder="you@example.com" style={inputStyle} />
              {errors.email && <p style={{ color: '#A32D2D', fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>{errors.email.message}</p>}
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={labelStyle}>Password</label>
              <input {...register('password', { required: 'Password is required' })} type="password" placeholder="••••••••••••" style={inputStyle} />
              {errors.password && <p style={{ color: '#A32D2D', fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#2e4029' : '#1C2B1A', color: '#D4AF6A', border: 'none', borderRadius: '6px', padding: '12px', fontFamily: 'Playfair Display, serif', fontSize: '15px', letterSpacing: '0.06em', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#8a7e6a', marginTop: '20px' }}>
            New to mTradingSignal?{' '}
            <Link to="/register" style={{ color: '#1C2B1A', textDecoration: 'underline' }}>Create an account</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#C8BFA8', marginTop: '24px' }}>
          <Link to="/" style={{ color: '#C8BFA8' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  );
}