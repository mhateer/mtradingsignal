import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllSubscriptions, changePlan, addCalls, extendExpiry, cancelSubscription } from '../../api/admin';
import type { Subscription } from '../../types/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PLANS = ['trial', 'basic', 'pro', 'enterprise'];
const STATUS_COLORS: Record<string, { color: string; background: string }> = {
  active:    { color: '#3B6D11', background: '#EAF3DE' },
  pending:   { color: '#8B6914', background: '#F5EDD6' },
  expired:   { color: '#A32D2D', background: '#FCEBEB' },
  cancelled: { color: '#6b6b6b', background: '#f0f0f0' },
};

const labelStyle = { fontSize: '10px', color: '#8a7e6a', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '8px 12px', border: '0.5px solid #DDD6C4', borderRadius: '6px', fontFamily: 'EB Garamond, serif', fontSize: '14px', background: '#FAF7F2', color: '#1C2B1A', outline: 'none' };
const actionBtn = { background: '#1C2B1A', color: '#D4AF6A', border: 'none', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'EB Garamond, serif', fontSize: '13px', letterSpacing: '0.04em' };

export default function AdminSubscriptions() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Subscription | null>(null);
  const [filter, setFilter] = useState('all');
  const [newPlan, setNewPlan] = useState('');
  const [extraCalls, setExtraCalls] = useState('');
  const [extraDays, setExtraDays] = useState('');

  const { data: subscriptions = [], isLoading } = useQuery({ queryKey: ['all-subscriptions'], queryFn: getAllSubscriptions });

  const planMutation = useMutation({ mutationFn: ({ id, plan }: { id: string; plan: string }) => changePlan(id, plan), onSuccess: () => { toast.success('Plan updated'); qc.invalidateQueries({ queryKey: ['all-subscriptions'] }); } });
  const callsMutation = useMutation({ mutationFn: ({ id, calls }: { id: string; calls: number }) => addCalls(id, calls), onSuccess: (data) => { toast.success(data.message); qc.invalidateQueries({ queryKey: ['all-subscriptions'] }); } });
  const expiryMutation = useMutation({ mutationFn: ({ id, days }: { id: string; days: number }) => extendExpiry(id, days), onSuccess: (data) => { toast.success(data.message); qc.invalidateQueries({ queryKey: ['all-subscriptions'] }); } });
  const cancelMutation = useMutation({ mutationFn: cancelSubscription, onSuccess: () => { toast.success('Subscription cancelled'); qc.invalidateQueries({ queryKey: ['all-subscriptions'] }); setSelected(null); } });

  const filtered = filter === 'all' ? subscriptions : subscriptions.filter((s: Subscription) => s.status === filter);

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: '36px', borderBottom: '0.5px solid #DDD6C4', paddingBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: 500, color: '#1C2B1A' }}>Subscriptions</h1>
        <p style={{ fontSize: '14px', color: '#8a7e6a', fontStyle: 'italic', marginTop: '4px' }}>
          Manage all subscription plans and usage limits.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['all', 'active', 'pending', 'expired', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 16px', borderRadius: '20px', border: '0.5px solid #DDD6C4',
            cursor: 'pointer', fontFamily: 'EB Garamond, serif', fontSize: '13px',
            letterSpacing: '0.04em', textTransform: 'capitalize',
            background: filter === f ? '#1C2B1A' : '#fff',
            color: filter === f ? '#D4AF6A' : '#8a7e6a',
          }}>{f}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: '20px' }}>

        {/* Table */}
        <div style={{ background: '#fff', border: '0.5px solid #DDD6C4', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #DDD6C4' }}>
                {['User', 'Plan', 'Status', 'Usage', 'Expires', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 18px', fontSize: '10px', color: '#8a7e6a', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#8a7e6a', fontStyle: 'italic' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#8a7e6a', fontStyle: 'italic' }}>No subscriptions found.</td></tr>
              ) : filtered.map((sub: Subscription) => (
                <tr key={sub.id} onClick={() => setSelected(sub)} style={{ borderBottom: '0.5px solid #EDE8DE', cursor: 'pointer', background: selected?.id === sub.id ? '#FAF7F2' : '#fff' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '13px', color: '#1C2B1A' }}>{sub.user?.email || '—'}</div>
                    <div style={{ fontSize: '11px', color: '#8a7e6a', fontStyle: 'italic' }}>{sub.user?.fullName || ''}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ fontSize: '11px', color: '#5C7A58', background: '#EAF0E8', padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {sub.plan}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px', ...(STATUS_COLORS[sub.status] || {}) }}>
                      {sub.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '13px', color: '#1C2B1A' }}>
                    {sub.callsUsed} / {sub.maxCalls === -1 ? '∞' : sub.maxCalls}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '13px', color: '#8a7e6a' }}>
                    {sub.expiresAt ? format(new Date(sub.expiresAt), 'MMM d, yyyy') : '—'}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <button style={{ fontSize: '11px', color: '#1C2B1A', background: 'none', border: '0.5px solid #DDD6C4', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Management panel */}
        {selected && (
          <div style={{ background: '#fff', border: '0.5px solid #DDD6C4', borderRadius: '8px', padding: '24px', alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: '#1C2B1A' }}>Manage Subscription</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#8a7e6a', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            {/* Info */}
            <div style={{ background: '#FAF7F2', border: '0.5px solid #EDE8DE', borderRadius: '6px', padding: '14px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#1C2B1A', marginBottom: '4px' }}>{selected.user?.email}</div>
              <div style={{ fontSize: '12px', color: '#8a7e6a', fontStyle: 'italic' }}>
                {selected.plan.toUpperCase()} · {selected.status} · ${selected.price}
              </div>
              <div style={{ fontSize: '12px', color: '#8a7e6a', marginTop: '4px' }}>
                Calls: {selected.callsUsed} / {selected.maxCalls === -1 ? '∞' : selected.maxCalls}
              </div>
            </div>

            {/* Change plan */}
            <div style={{ marginBottom: '16px' }}>
              <div style={labelStyle}>Change Plan</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select value={newPlan} onChange={e => setNewPlan(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                  <option value="">Select plan</option>
                  {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button
                  onClick={() => { if (newPlan) planMutation.mutate({ id: selected.id, plan: newPlan }); }}
                  style={actionBtn}
                >Apply</button>
              </div>
            </div>

            {/* Add calls */}
            <div style={{ marginBottom: '16px' }}>
              <div style={labelStyle}>Add Extra API Calls</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" value={extraCalls} onChange={e => setExtraCalls(e.target.value)} placeholder="e.g. 500" style={{ ...inputStyle, flex: 1 }} />
                <button
                  onClick={() => { if (extraCalls) callsMutation.mutate({ id: selected.id, calls: parseInt(extraCalls) }); setExtraCalls(''); }}
                  style={actionBtn}
                >Add</button>
              </div>
            </div>

            {/* Extend expiry */}
            <div style={{ marginBottom: '20px' }}>
              <div style={labelStyle}>Extend Expiry (days)</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" value={extraDays} onChange={e => setExtraDays(e.target.value)} placeholder="e.g. 7" style={{ ...inputStyle, flex: 1 }} />
                <button
                  onClick={() => { if (extraDays) expiryMutation.mutate({ id: selected.id, days: parseInt(extraDays) }); setExtraDays(''); }}
                  style={actionBtn}
                >Extend</button>
              </div>
            </div>

            {/* Cancel */}
            <div style={{ borderTop: '0.5px solid #EDE8DE', paddingTop: '16px' }}>
              <button
                onClick={() => { if (confirm('Cancel this subscription?')) cancelMutation.mutate(selected.id); }}
                style={{ width: '100%', background: '#FCEBEB', color: '#A32D2D', border: '0.5px solid #f5c6c6', borderRadius: '6px', padding: '10px', cursor: 'pointer', fontFamily: 'EB Garamond, serif', fontSize: '13px', letterSpacing: '0.04em' }}
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}