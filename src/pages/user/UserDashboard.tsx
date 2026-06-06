import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMySubscription, getMySubscriptions, getPlans, requestSubscription, regenerateApiKey } from '../../api/userAuth'; import { useUserAuthStore } from '../../store/userAuthStore';
import type { Plan, Subscription } from '../../types/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const labelStyle = { fontSize: '10px', color: '#8a7e6a', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '6px' };
const cardStyle = { background: '#fff', border: '0.5px solid #DDD6C4', borderRadius: '8px', padding: '24px' };
const inputStyle = { width: '100%', padding: '10px 14px', border: '0.5px solid #DDD6C4', borderRadius: '6px', fontFamily: 'EB Garamond, serif', fontSize: '14px', background: '#FAF7F2', color: '#1C2B1A', outline: 'none' };

const STATUS_COLORS: Record<string, { color: string; background: string }> = {
  active: { color: '#3B6D11', background: '#EAF3DE' },
  pending: { color: '#8B6914', background: '#F5EDD6' },
  expired: { color: '#A32D2D', background: '#FCEBEB' },
  cancelled: { color: '#6b6b6b', background: '#f0f0f0' },
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, logout, updateUser } = useUserAuthStore();
  const [showKey, setShowKey] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const { data: activeSub, isLoading: subLoading } = useQuery({ queryKey: ['active-sub'], queryFn: getMySubscription });
  const { data: history = [] } = useQuery({ queryKey: ['my-subs'], queryFn: getMySubscriptions });

  const { data: plansData } = useQuery({ queryKey: ['plans'], queryFn: getPlans });

  const hasActiveSub = activeSub?.plan && activeSub?.status === 'active';
  const hasPendingSub = history.some((s: Subscription) => s.status === 'pending');

  const regenMutation = useMutation({
    mutationFn: regenerateApiKey,
    onSuccess: (data) => {
      toast.success('API key regenerated');
      updateUser({ ...user!, apiKey: data.apiKey });
      setShowKey(true);
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: () => requestSubscription(selectedPlan, paymentRef, paymentNote),
    onSuccess: () => {
      toast.success('Subscription request submitted. Admin will confirm within 24 hours.');
      setShowSubscribeModal(false);
      setPaymentRef(''); setPaymentNote(''); setSelectedPlan('');
      qc.invalidateQueries({ queryKey: ['my-subs'] });
      qc.invalidateQueries({ queryKey: ['active-sub'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Request failed'),
  });

  const handleLogout = () => { logout(); navigate('/login'); };

  const callsPercent = activeSub?.maxCalls && activeSub.maxCalls !== 'unlimited'
    ? Math.min(100, Math.round((activeSub.callsUsed / activeSub.maxCalls) * 100)) : 0;

  const maskedKey = user?.apiKey
    ? `${user.apiKey.slice(0, 8)}${'•'.repeat(20)}${user.apiKey.slice(-4)}`
    : '—';

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>

      {/* Nav */}
      <nav style={{ background: '#1C2B1A', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '56px' }}>
        <a href="/"><div style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: '#D4AF6A', letterSpacing: '0.04em' }}>mTradingSignal</div></a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '13px', color: '#8aaa84', fontFamily: 'EB Garamond, serif' }}>{user?.email}</span>
          <button onClick={handleLogout} style={{ fontSize: '12px', color: '#5C7A58', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'EB Garamond, serif' }}>Sign Out →</button>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: 500, color: '#1C2B1A' }}>
            Welcome, {user?.fullName || user?.email}
          </h1>
          <p style={{ fontSize: '14px', color: '#8a7e6a', fontStyle: 'italic', marginTop: '4px' }}>Your trade signal intelligence dashboard.</p>
        </div>

        {/* LOCKED STATE — no active subscription */}
        {!subLoading && !hasActiveSub && (
          <div style={{ marginBottom: '24px' }}>

            {/* Pending payment notice */}
            {hasPendingSub && (
              <div style={{ background: '#F5EDD6', border: '0.5px solid #e8d9a8', borderRadius: '8px', padding: '20px 24px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ fontSize: '20px' }}>⏳</div>
                <div>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: '#8B6914', marginBottom: '4px' }}>Payment Under Review</div>
                  <p style={{ fontSize: '13px', color: '#8B6914', fontStyle: 'italic' }}>
                    Your payment reference has been submitted. Our team will verify and activate your subscription within 24 hours.
                    Your dashboard will unlock automatically upon confirmation.
                  </p>
                </div>
              </div>
            )}

            {/* Subscribe CTA */}
            {!hasPendingSub && (
              <div style={{ background: '#fff', border: '0.5px solid #DDD6C4', borderRadius: '8px', padding: '40px', textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#1C2B1A', marginBottom: '8px' }}>
                  Subscribe to Access the API
                </div>
                <p style={{ fontSize: '14px', color: '#8a7e6a', fontStyle: 'italic', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                  Choose a plan and submit your bank transfer reference. Your API key and signals will be unlocked after payment confirmation.
                </p>
                <button
                  onClick={() => setShowSubscribeModal(true)}
                  style={{ background: '#1C2B1A', color: '#D4AF6A', border: 'none', borderRadius: '6px', padding: '12px 28px', cursor: 'pointer', fontFamily: 'Playfair Display, serif', fontSize: '15px', letterSpacing: '0.06em' }}
                >
                  Choose a Plan →
                </button>
              </div>
            )}

            {/* Locked API key preview */}
            <div style={{ ...cardStyle, opacity: 0.5, pointerEvents: 'none' as const, marginBottom: '16px' }}>
              <div style={labelStyle}>API Key — Locked</div>
              <div style={{ background: '#FAF7F2', border: '0.5px solid #EDE8DE', borderRadius: '6px', padding: '14px' }}>
                <code style={{ fontSize: '13px', color: '#C8BFA8' }}>ksh_••••••••••••••••••••••••••••••••</code>
              </div>
              <p style={{ fontSize: '12px', color: '#C8BFA8', fontStyle: 'italic', marginTop: '10px' }}>Available after subscription is activated.</p>
            </div>
          </div>
        )}

        {/* ACTIVE STATE */}
        {hasActiveSub && (
          <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

            {/* Subscription status */}
            <div style={cardStyle}>
              <div style={labelStyle}>Current Plan</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#1C2B1A', textTransform: 'capitalize' }}>{activeSub.plan}</span>
                <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px', ...(STATUS_COLORS[activeSub.status] || {}) }}>{activeSub.status}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div><div style={labelStyle}>Calls Used</div><div style={{ fontSize: '15px', color: '#1C2B1A' }}>{activeSub.callsUsed} / {activeSub.maxCalls === 'unlimited' ? '∞' : activeSub.maxCalls}</div></div>
                <div><div style={labelStyle}>Max Rows</div><div style={{ fontSize: '15px', color: '#1C2B1A' }}>{activeSub.maxRows}</div></div>
                <div><div style={labelStyle}>Expires</div><div style={{ fontSize: '14px', color: '#1C2B1A' }}>{activeSub.expiresAt ? format(new Date(activeSub.expiresAt), 'MMM d, yyyy') : '—'}</div></div>
                <div><div style={labelStyle}>Calls Left</div><div style={{ fontSize: '15px', color: activeSub.callsRemaining === 0 ? '#A32D2D' : '#3B6D11' }}>{activeSub.callsRemaining === 'unlimited' ? '∞' : activeSub.callsRemaining}</div></div>
              </div>
              {activeSub.maxCalls !== 'unlimited' && (
                <div>
                  <div style={{ background: '#EDE8DE', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${callsPercent}%`, background: callsPercent > 80 ? '#A32D2D' : '#3B6D11', borderRadius: '4px' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: '#8a7e6a', marginTop: '4px', fontStyle: 'italic' }}>{callsPercent}% used</div>
                </div>
              )}
            </div>

            {/* API Key */}
            <div style={cardStyle}>
              <div style={labelStyle}>API Key</div>
              <div style={{ background: '#FAF7F2', border: '0.5px solid #EDE8DE', borderRadius: '6px', padding: '14px', marginBottom: '14px' }}>
                <code style={{ fontSize: '12px', color: '#1C2B1A', wordBreak: 'break-all' as const, display: 'block', marginBottom: '10px' }}>
                  {showKey ? user?.apiKey : maskedKey}
                </code>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setShowKey(!showKey)} style={{ fontSize: '11px', color: '#5C7A58', background: '#EAF0E8', border: 'none', borderRadius: '4px', padding: '5px 12px', cursor: 'pointer', fontFamily: 'EB Garamond, serif' }}>
                    {showKey ? 'Hide' : 'Reveal'}
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(user?.apiKey || ''); toast.success('Copied!'); }} style={{ fontSize: '11px', color: '#8B6914', background: '#F5EDD6', border: 'none', borderRadius: '4px', padding: '5px 12px', cursor: 'pointer', fontFamily: 'EB Garamond, serif' }}>
                    Copy
                  </button>
                </div>
              </div>
              <button onClick={() => { if (confirm('Regenerate API key? Your old key will stop working immediately.')) regenMutation.mutate(); }} style={{ fontSize: '12px', color: '#A32D2D', background: '#FCEBEB', border: 'none', borderRadius: '4px', padding: '7px 14px', cursor: 'pointer', fontFamily: 'EB Garamond, serif' }}>
                Regenerate Key
              </button>
              <p style={{ fontSize: '11px', color: '#C8BFA8', fontStyle: 'italic', marginTop: '10px' }}>
                Pass as <code style={{ background: '#EDE8DE', padding: '1px 5px', borderRadius: '3px' }}>x-api-key</code> header.
              </p>
            </div>
          </div>
        )}

        {/* Subscription history */}
        <div style={{ ...cardStyle, marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', color: '#1C2B1A' }}>Subscription History</h2>
              <p style={{ fontSize: '13px', color: '#8a7e6a', fontStyle: 'italic', marginTop: '2px' }}>All your plans</p>
            </div>
            {hasActiveSub && (
              <button onClick={() => setShowSubscribeModal(true)} style={{ background: '#1C2B1A', color: '#D4AF6A', border: 'none', borderRadius: '6px', padding: '9px 18px', cursor: 'pointer', fontFamily: 'EB Garamond, serif', fontSize: '13px', letterSpacing: '0.04em' }}>
                + Renew / Upgrade
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#8a7e6a', fontStyle: 'italic', padding: '24px' }}>No subscriptions yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #DDD6C4' }}>
                  {['Plan', 'Status', 'Price', 'Calls Used', 'Expires', 'Reference'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', color: '#8a7e6a', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((sub: Subscription) => (
                  <tr key={sub.id} style={{ borderBottom: '0.5px solid #EDE8DE' }}>
                    <td style={{ padding: '12px 14px' }}><span style={{ fontSize: '11px', color: '#5C7A58', background: '#EAF0E8', padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{sub.plan}</span></td>
                    <td style={{ padding: '12px 14px' }}><span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', ...(STATUS_COLORS[sub.status] || {}) }}>{sub.status}</span></td>
                    <td style={{ padding: '12px 14px', fontSize: '14px', color: '#1C2B1A' }}>${sub.price}</td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#8a7e6a' }}>{sub.callsUsed} / {sub.maxCalls === -1 ? '∞' : sub.maxCalls}</td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#8a7e6a' }}>{sub.expiresAt ? format(new Date(sub.expiresAt), 'MMM d, yyyy') : '—'}</td>
                    <td style={{ padding: '12px 14px' }}><code style={{ fontSize: '11px', color: '#8a7e6a' }}>{sub.paymentReference || '—'}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* API usage guide — only shown when active */}
        {hasActiveSub && (
          <div style={cardStyle}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', color: '#1C2B1A', marginBottom: '16px' }}>API Usage</h2>
            <div style={{ background: '#1C2B1A', borderRadius: '6px', padding: '16px', marginBottom: '12px' }}>
              <code style={{ fontSize: '12px', color: '#8aaa84', display: 'block', lineHeight: '1.8' }}>
                <span style={{ color: '#D4AF6A' }}>GET</span> https://api.mtradingsignal.com/api/v1/signals/gold<br />
                <span style={{ color: '#5C7A58' }}>x-api-key:</span> <span style={{ color: '#D4AF6A' }}>your-api-key-here</span>
              </code>
            </div>
            <p style={{ fontSize: '13px', color: '#8a7e6a', fontStyle: 'italic' }}>
              Returns trade signals up to your plan's row limit. Each call counts toward your monthly quota.
            </p>
          </div>
        )}
      </div>

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,43,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '36px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' as const }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#1C2B1A' }}>Choose a Plan</h2>
              <button onClick={() => setShowSubscribeModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#8a7e6a', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
              {plansData?.plans?.map((plan: Plan) => (
                <div key={plan.plan} onClick={() => setSelectedPlan(plan.plan)} style={{ padding: '14px 18px', border: `0.5px solid ${selectedPlan === plan.plan ? '#1C2B1A' : '#DDD6C4'}`, borderRadius: '8px', cursor: 'pointer', background: selectedPlan === plan.plan ? '#FAF7F2' : '#fff', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', color: '#1C2B1A', textTransform: 'capitalize' }}>{plan.plan}</span>
                      <span style={{ fontSize: '12px', color: '#8a7e6a', fontStyle: 'italic', marginLeft: '8px' }}>{plan.note}</span>
                    </div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#D4AF6A' }}>${plan.price}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#8a7e6a', marginTop: '4px' }}>
                    {plan.duration} · {typeof plan.maxCalls === 'number' ? plan.maxCalls.toLocaleString() : plan.maxCalls} calls · {plan.maxRows} rows
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#F5EDD6', border: '0.5px solid #e8d9a8', borderRadius: '6px', padding: '14px', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#8B6914', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Payment Instructions</div>
              <p style={{ fontSize: '13px', color: '#8B6914', fontStyle: 'italic' }}>
                Transfer the plan amount via any (bank transfer, Xoom, PayPal), using the following details. After payment, enter your transaction reference in the form below and submit. Your subscription will be activated within 2 hours of payment confirmation.
                <br />
              </p>
              <div style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                backgroundColor: '#FAFAF9',
                border: '1px solid #E7E5E4',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '450px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                margin: '10px 0'
              }}>
                <h3 style={{
                  margin: '0 0 20px 0',
                  fontSize: '16px',
                  color: '#1C2B1A',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Payment Details
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {/* Bank Name Box */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E7E5E4',
                    borderRadius: '8px',
                    padding: '12px 16px'
                  }}>
                    <span style={{ fontSize: '13px', color: '#8B6914' }}>Bank Name</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1C2B1A', textAlign: 'right' }}>
                      United Bank Limited (UBL)
                    </span>
                  </div>

                  {/* Account Title Box */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E7E5E4',
                    borderRadius: '8px',
                    padding: '12px 16px'
                  }}>
                    <span style={{ fontSize: '13px', color: '#8B6914' }}>Account Title</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1C2B1A', textAlign: 'right' }}>
                      Mahateer Muhammad
                    </span>
                  </div>

                  {/* Account Number Box */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#F3F4F1', /* Slight green tint for emphasis */
                    border: '1px solid #D6DCD4',
                    borderRadius: '8px',
                    padding: '12px 16px'
                  }}>
                    <span style={{ fontSize: '13px', color: '#8B6914' }}>Account Number</span>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#1C2B1A',
                      letterSpacing: '1px',
                      textAlign: 'right'
                    }}>
                      1749246676715
                    </span>
                  </div>
                  {/* Account Number Box */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#F3F4F1', /* Slight green tint for emphasis */
                    border: '1px solid #D6DCD4',
                    borderRadius: '8px',
                    padding: '12px 16px'
                  }}>
                    <span style={{ fontSize: '13px', color: '#8B6914' }}>IBAN</span>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#1C2B1A',
                      letterSpacing: '1px',
                      textAlign: 'right'
                    }}>
                      PK82UNIL0109000246676715
                    </span>
                  </div>

                </div>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ ...labelStyle, display: 'block' }}>Transaction Reference *</label>
              <input value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="e.g. HBL-2026-123456" style={inputStyle} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ ...labelStyle, display: 'block' }}>Note (optional)</label>
              <textarea value={paymentNote} onChange={e => setPaymentNote(e.target.value)} placeholder="Any additional information..." rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>

            <button
              onClick={() => subscribeMutation.mutate()}
              disabled={!selectedPlan || !paymentRef || subscribeMutation.isPending}
              style={{ width: '100%', background: (!selectedPlan || !paymentRef) ? '#DDD6C4' : '#1C2B1A', color: (!selectedPlan || !paymentRef) ? '#8a7e6a' : '#D4AF6A', border: 'none', borderRadius: '6px', padding: '13px', fontFamily: 'Playfair Display, serif', fontSize: '15px', letterSpacing: '0.06em', cursor: (!selectedPlan || !paymentRef) ? 'not-allowed' : 'pointer' }}
            >
              {subscribeMutation.isPending ? 'Submitting...' : 'Submit Subscription Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}