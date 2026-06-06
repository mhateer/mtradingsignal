import { useQuery } from '@tanstack/react-query';
import { getPendingSubscriptions } from '../../api/admin';
import type { Subscription } from '../../types/types';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['pending-subscriptions'],
    queryFn: getPendingSubscriptions,
    refetchInterval: 30000,
  });

  const stats = [
    { label: 'Pending Payments', value: pending.length, accent: true },
    { label: 'Active Users', value: '—', accent: false },
    { label: 'This Month', value: '—', accent: false },
  ];

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: '36px', borderBottom: '0.5px solid #DDD6C4', paddingBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: 500, color: '#1C2B1A' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: '#8a7e6a', fontStyle: 'italic', marginTop: '4px' }}>
          Welcome back — here is what requires your attention.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '36px' }}>
        {stats.map(({ label, value, accent }) => (
          <div key={label} style={{ background: '#fff', border: '0.5px solid #DDD6C4', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '10px', color: '#8a7e6a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
              {label}
            </div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', fontWeight: 500, color: accent ? '#D4AF6A' : '#1C2B1A' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '0.5px solid #DDD6C4', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '0.5px solid #EDE8DE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', fontWeight: 500, color: '#1C2B1A' }}>
              Pending Payments
            </h2>
            <p style={{ fontSize: '13px', color: '#8a7e6a', fontStyle: 'italic', marginTop: '2px' }}>
              Awaiting your confirmation
            </p>
          </div>
          {pending.length > 0 && (
            <span style={{ background: '#F5EDD6', color: '#8B6914', fontSize: '11px', padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.06em' }}>
              {pending.length} pending
            </span>
          )}
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a7e6a', fontStyle: 'italic' }}>Loading...</div>
        ) : pending.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#8a7e6a', fontStyle: 'italic' }}>
            No pending payments at this time.
          </div>
        ) : (
          pending.map((sub: Subscription) => (
            <div key={sub.id} style={{ padding: '18px 24px', borderBottom: '0.5px solid #EDE8DE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '15px', color: '#1C2B1A', marginBottom: '4px' }}>
                  {sub.user?.email || sub.userId}{' '}
                  <span style={{ fontSize: '10px', color: '#5C7A58', background: '#EAF0E8', padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.08em', verticalAlign: 'middle' }}>
                    {sub.plan}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#8a7e6a', fontStyle: 'italic' }}>
                  ${sub.price} · Ref: {sub.paymentReference}
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/payments')}
                style={{ background: '#1C2B1A', color: '#D4AF6A', border: 'none', borderRadius: '4px', padding: '8px 18px', cursor: 'pointer', fontFamily: 'EB Garamond, serif', fontSize: '13px', letterSpacing: '0.06em' }}
              >
                Review →
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}