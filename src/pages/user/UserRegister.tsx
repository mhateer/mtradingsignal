import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { initiateRegister, verifyOtp, resendOtp } from '../../api/userAuth';
import toast from 'react-hot-toast';

interface RegisterForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface OtpForm {
  otp: string;
}

export default function UserRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [pendingEmail, setPendingEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const { register: regOtp, handleSubmit: handleOtp, formState: { errors: otpErrors } } = useForm<OtpForm>();

  const onRegister = async (data: RegisterForm) => {
    if (!data.email.endsWith('@gmail.com')) {
      toast.error('Only Gmail addresses are accepted');
      return;
    }
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await initiateRegister(data.email, data.password, data.fullName);
      setPendingEmail(data.email);
      setStep('otp');
      toast.success('Verification code sent to your Gmail');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (data: OtpForm) => {
    setLoading(true);
    try {
      await verifyOtp(pendingEmail, data.otp);
      toast.success('Email verified! Please log in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtp(pendingEmail);
      toast.success('New code sent to your Gmail');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

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

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '36px' }}>

          {step === 'register' ? (
            <>
              <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '20px', color: 'var(--green-deep)', margin: '0 0 24px' }}>
                Create Account
              </h2>
              <form onSubmit={handleSubmit(onRegister)}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Full Name</label>
                  <input
                    {...register('fullName', { required: 'Full name is required' })}
                    placeholder="Ahmed Al-Rashid"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', color: 'var(--green-deep)', background: 'var(--cream)', boxSizing: 'border-box' }}
                  />
                  {errors.fullName && <p style={{ color: '#c0392b', fontSize: '12px', margin: '4px 0 0' }}>{errors.fullName.message}</p>}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Gmail Address</label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      validate: v => v.endsWith('@gmail.com') || 'Only Gmail addresses are accepted'
                    })}
                    type="email"
                    placeholder="yourname@gmail.com"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', color: 'var(--green-deep)', background: 'var(--cream)', boxSizing: 'border-box' }}
                  />
                  {errors.email && <p style={{ color: '#c0392b', fontSize: '12px', margin: '4px 0 0' }}>{errors.email.message}</p>}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Password</label>
                  <input
                    {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
                    type="password"
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', color: 'var(--green-deep)', background: 'var(--cream)', boxSizing: 'border-box' }}
                  />
                  {errors.password && <p style={{ color: '#c0392b', fontSize: '12px', margin: '4px 0 0' }}>{errors.password.message}</p>}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Confirm Password</label>
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: v => v === watch('password') || 'Passwords do not match'
                    })}
                    type="password"
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', color: 'var(--green-deep)', background: 'var(--cream)', boxSizing: 'border-box' }}
                  />
                  {errors.confirmPassword && <p style={{ color: '#c0392b', fontSize: '12px', margin: '4px 0 0' }}>{errors.confirmPassword.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '12px', background: 'var(--green-deep)', color: 'var(--gold)', border: 'none', borderRadius: '8px', fontSize: '14px', fontFamily: 'Playfair Display, Georgia, serif', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Sending Code...' : 'Continue'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--green-deep)', fontWeight: '600' }}>Sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '20px', color: 'var(--green-deep)', margin: '0 0 8px' }}>
                Verify Your Email
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: '1.6' }}>
                A 6-digit code was sent to <strong>{pendingEmail}</strong>. It expires in 10 minutes.
              </p>

              <form onSubmit={handleOtp(onVerifyOtp)}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Verification Code</label>
                  <input
                    {...regOtp('otp', {
                      required: 'Code is required',
                      minLength: { value: 6, message: 'Code must be 6 digits' },
                      maxLength: { value: 6, message: 'Code must be 6 digits' },
                      pattern: { value: /^\d{6}$/, message: 'Code must be 6 digits' }
                    })}
                    placeholder="* * * * * *"
                    maxLength={6}
                    style={{ width: '100%', padding: '14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '28px', fontFamily: 'monospace', letterSpacing: '12px', textAlign: 'center', color: 'var(--green-deep)', background: 'var(--cream)', boxSizing: 'border-box' }}
                  />
                  {otpErrors.otp && <p style={{ color: '#c0392b', fontSize: '12px', margin: '4px 0 0' }}>{otpErrors.otp.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '12px', background: 'var(--green-deep)', color: 'var(--gold)', border: 'none', borderRadius: '8px', fontSize: '14px', fontFamily: 'Playfair Display, Georgia, serif', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginBottom: '12px' }}
                >
                  {loading ? 'Verifying...' : 'Verify & Create Account'}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  style={{ width: '100%', padding: '10px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', cursor: resending ? 'not-allowed' : 'pointer', opacity: resending ? 0.6 : 1 }}
                >
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Wrong email?{' '}
                <button onClick={() => setStep('register')} style={{ background: 'none', border: 'none', color: 'var(--green-deep)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', padding: 0 }}>
                  Go back
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}