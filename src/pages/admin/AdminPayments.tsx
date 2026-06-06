import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingSubscriptions, confirmPayment } from '../../api/admin';
import type { Subscription } from '../../types/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminPayments() {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<string | null>(null);

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['pending-subscriptions'],
    queryFn: getPendingSubscriptions,
    refetchInterval: 15000,
  });

  const mutation = useMutation({
    mutationFn: confirmPayment,
    onSuccess: () => {
      toast.success('Payment confirmed. Subscription activated.');
      queryClient.invalidateQueries({ queryKey: ['pending-subscriptions'] });
      setConfirming(null);
    },
    onError: () => {
      toast.error('Failed to confirm payment.');
      setConfirming(null);
    },
  });

  const handleConfirm = (id: string) => {
    setConfirming(id);
    mutation.mutate(id);
  };

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: '36px', borderBottom: '0.5px solid #DDD6C4', paddingBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: 500, color: '#1C2B1A' }}>
          Pending Payments
        </h1>
        <p style={{ fontSize: '14px', color: '#8a7e6a', fontStyle: 'italic', marginTop: '4px' }}>
          Review bank transfer references and confirm subscriptions.
        </p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', color: '#8a7e6a', fontStyle: 'italic', padding: '60px' }}>Loading...</div>
      ) : pending.length === 0 ? (
        <div style={{ background: '#fff', border: '0.5px solid #DDD6C4', borderRadius: '8px', padding: '64px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#1C2B1A', marginBottom: '8px' }}>
            All clear
          </div>
          <div style={{ fontSize: '14px', color: '#8a7e6a', fontStyle: 'italic' }}>
            No pending payments to review.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pending.map((sub: Subscription) => (
            <div key={sub.id} style={{ background: '#fff', border: '0.5px solid #DDD6C4', borderRadius: '8px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
                <div style={{ flex: 1 }}>

                  {/* Plan badge */}
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{
                      fontSize: '10px', color: '#5C7A58', background: '#EAF0E8',
                      padding: '3px 10px', borderRadius: '20px',
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}>{sub.plan}</span>
                    <span style={{
                      fontSize: '10px', color: '#8B6914', background: '#F5EDD6',
                      padding: '3px 10px', borderRadius: '20px',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      marginLeft: '8px',
                    }}>Pending</span>
                  </div>

                  {/* Details grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#8a7e6a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Customer
                      </div>
                      <div style={{ fontSize: '15px', color: '#1C2B1A' }}>{sub.user?.email || '—'}</div>
                      {sub.user?.fullName && (
                        <div style={{ fontSize: '13px', color: '#8a7e6a', fontStyle: 'italic' }}>{sub.user.fullName}</div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#8a7e6a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Payment Reference
                      </div>
                      <div style={{ fontSize: '15px', color: '#1C2B1A', fontFamily: 'monospace' }}>{sub.paymentReference}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#8a7e6a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Amount
                      </div>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#3B6D11' }}>
                        ${sub.price}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#8a7e6a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Requested
                      </div>
                      <div style={{ fontSize: '14px', color: '#1C2B1A' }}>
                        {format(new Date(sub.createdAt), 'MMM d, yyyy · HH:mm')}
                      </div>
                    </div>
                  </div>

                  {sub.paymentNote && (
                    <div style={{ marginTop: '16px', background: '#FAF7F2', border: '0.5px solid #EDE8DE', borderRadius: '6px', padding: '12px 16px' }}>
                      <div style={{ fontSize: '10px', color: '#8a7e6a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Customer Note
                      </div>
                      <div style={{ fontSize: '14px', color: '#1C2B1A', fontStyle: 'italic' }}>{sub.paymentNote}</div>
                    </div>
                  )}
                </div>

                {/* Action */}
                <button
                  onClick={() => handleConfirm(sub.id)}
                  disabled={confirming === sub.id}
                  style={{
                    background: confirming === sub.id ? '#2e4029' : '#1C2B1A',
                    color: '#D4AF6A', border: 'none', borderRadius: '6px',
                    padding: '12px 24px', cursor: confirming === sub.id ? 'not-allowed' : 'pointer',
                    fontFamily: 'EB Garamond, serif', fontSize: '14px',
                    letterSpacing: '0.06em', whiteSpace: 'nowrap',
                    transition: 'background 0.2s',
                  }}
                >
                  {confirming === sub.id ? 'Confirming...' : 'Confirm Payment →'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}