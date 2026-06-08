import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const PIN_LENGTH = 11;
const PIN_TOKEN_KEY = 'mts_admin_pin_token';

export function useAdminPinAuth() {
  return !!sessionStorage.getItem(PIN_TOKEN_KEY);
}

export function clearAdminPin() {
  sessionStorage.removeItem(PIN_TOKEN_KEY);
}

export default function AdminPinGate({ onVerified }: { onVerified: () => void }) {
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    if (value && index < PIN_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
    if (newPin.every(d => d !== '') && newPin.join('').length === PIN_LENGTH) {
      handleSubmit(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    const newPin = Array(PIN_LENGTH).fill('');
    pasted.split('').forEach((d, i) => { newPin[i] = d; });
    setPin(newPin);
    inputs.current[Math.min(pasted.length, PIN_LENGTH - 1)]?.focus();
    if (pasted.length === PIN_LENGTH) handleSubmit(pasted);
  };

  const handleSubmit = async (pinValue: string) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/admin-pin`,
        { pin: pinValue }
      );
      sessionStorage.setItem(PIN_TOKEN_KEY, res.data.pinToken);
      toast.success('Access granted');
      onVerified();
    } catch {
      setShake(true);
      setPin(Array(PIN_LENGTH).fill(''));
      inputs.current[0]?.focus();
      toast.error('Incorrect PIN');
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .pin-shake { animation: shake 0.5s ease; }
        .pin-input:focus { 
          border-color: #D4AF6A !important; 
          box-shadow: 0 0 0 3px #D4AF6A22 !important;
          outline: none;
        }
        .pin-input { transition: all 0.2s; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #1e3a1c 0%, #0d1a0c 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>

          {/* Logo */}
          <div style={{ marginBottom: '40px' }}>
            <img src="/mts-logo.png" alt="mTradingSignal"
              style={{ width: '64px', height: '64px', objectFit: 'contain', margin: '0 auto 16px', display: 'block' }}
            />
            <h1 style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '22px', color: '#D4AF6A', margin: '0 0 6px', fontWeight: 400,
            }}>
              mTradingSignal
            </h1>
            <p style={{ color: '#5C7A58', fontSize: '11px', letterSpacing: '0.16em', margin: 0 }}>
              RESTRICTED ACCESS
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: '#1C2B1A',
            border: '1px solid #D4AF6A22',
            borderRadius: '16px',
            padding: '40px 32px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: '#D4AF6A15', border: '1px solid #D4AF6A33',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <span style={{ fontSize: '22px' }}>🔐</span>
            </div>

            <h2 style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '20px', color: '#FAF7F2', margin: '0 0 8px', fontWeight: 400,
            }}>
              Enter Access PIN
            </h2>
            <p style={{
              color: '#5C7A58', fontSize: '13px', fontStyle: 'italic',
              margin: '0 0 32px', lineHeight: 1.6,
            }}>
              This area is restricted. Enter the 11-digit administrator PIN to continue.
            </p>

            {/* PIN inputs */}
            <div
              className={shake ? 'pin-shake' : ''}
              style={{
                display: 'flex', gap: '8px', justifyContent: 'center',
                flexWrap: 'wrap', marginBottom: '32px',
              }}
              onPaste={handlePaste}
            >
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputs.current[i] = el; }}
                  className="pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  disabled={loading}
                  style={{
                    width: '40px', height: '48px',
                    textAlign: 'center', fontSize: '20px',
                    fontFamily: 'monospace',
                    background: digit ? '#2e4029' : '#162414',
                    border: `1px solid ${digit ? '#D4AF6A55' : '#2e4029'}`,
                    borderRadius: '8px', color: '#D4AF6A',
                    cursor: 'text',
                  }}
                />
              ))}
            </div>

            {loading && (
              <div style={{ color: '#5C7A58', fontSize: '13px', fontStyle: 'italic' }}>
                Verifying...
              </div>
            )}
          </div>

          <p style={{ color: '#2e4029', fontSize: '11px', marginTop: '24px', fontStyle: 'italic' }}>
            Unauthorized access attempts are logged !.
          </p>
        </div>
      </div>
    </>
  );
}