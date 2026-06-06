import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { login } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface LoginForm {
  email: string;
  password: string;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login: setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await login(data.email, data.password);
      setAuth(res.accessToken, res.user);
      toast.success('Welcome back.');
      navigate('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F0E8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '24px', fontWeight: 500,
            color: '#1C2B1A', marginBottom: '6px',
          }}>Admin Portal</h1>
          
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          border: '0.5px solid #DDD6C4',
          borderRadius: '10px',
          padding: '36px',
        }}>
          <form onSubmit={handleSubmit(onSubmit)}>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', fontSize: '11px', color: '#8a7e6a',
                letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px',
              }}>Email Address</label>
              <input
                {...register('email', { required: 'Email is required' })}
                type="email"
                placeholder="username"
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '0.5px solid #DDD6C4', borderRadius: '6px',
                  fontFamily: 'EB Garamond, serif', fontSize: '15px',
                  background: '#FAF7F2', color: '#1C2B1A',
                  outline: 'none',
                }}
              />
              {errors.email && (
                <p style={{ color: '#A32D2D', fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block', fontSize: '11px', color: '#8a7e6a',
                letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px',
              }}>Password</label>
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                placeholder="••••••••••••"
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '0.5px solid #DDD6C4', borderRadius: '6px',
                  fontFamily: 'EB Garamond, serif', fontSize: '15px',
                  background: '#FAF7F2', color: '#1C2B1A',
                  outline: 'none',
                }}
              />
              {errors.password && (
                <p style={{ color: '#A32D2D', fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#2e4029' : '#1C2B1A',
                color: '#D4AF6A',
                border: 'none',
                borderRadius: '6px',
                padding: '12px',
                fontFamily: 'Playfair Display, serif',
                fontSize: '15px',
                letterSpacing: '0.06em',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center', fontSize: '11px', color: '#C8BFA8',
          marginTop: '24px', letterSpacing: '0.06em',
        }}>
          Restricted access — authorised personnel only
        </p>
      </div>
    </div>
  );
}