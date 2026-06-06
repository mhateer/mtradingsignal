import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, activateUser, deactivateUser, resetApiKey, deleteUser, getUserSubscriptions } from '../../api/admin';
import type { User, Subscription } from '../../types/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const labelStyle = {
  fontSize: '10px', color: '#8a7e6a',
  letterSpacing: '0.12em', textTransform: 'uppercase' as const,
  marginBottom: '4px',
};

const btnStyle = (color: string, bg: string) => ({
  fontSize: '11px', padding: '4px 12px', borderRadius: '4px',
  border: 'none', cursor: 'pointer', fontFamily: 'EB Garamond, serif',
  letterSpacing: '0.04em', color, background: bg, transition: 'opacity 0.15s',
});

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<User | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data: users = [], isLoading } = useQuery({ queryKey: ['all-users'], queryFn: getAllUsers });
  const { data: history = [] } = useQuery({
    queryKey: ['user-subs', selected?.id],
    queryFn: () => getUserSubscriptions(selected!.id),
    enabled: !!selected && showHistory,
  });

  const qc = queryClient;
  const activate = useMutation({ mutationFn: activateUser, onSuccess: () => { toast.success('User activated'); qc.invalidateQueries({ queryKey: ['all-users'] }); } });
  const deactivate = useMutation({ mutationFn: deactivateUser, onSuccess: () => { toast.success('User deactivated'); qc.invalidateQueries({ queryKey: ['all-users'] }); } });
  const resetKey = useMutation({ mutationFn: resetApiKey, onSuccess: (data) => { toast.success(`New key: ${data.apiKey}`); qc.invalidateQueries({ queryKey: ['all-users'] }); } });
  const remove = useMutation({ mutationFn: deleteUser, onSuccess: () => { toast.success('User deleted'); qc.invalidateQueries({ queryKey: ['all-users'] }); setSelected(null); } });

  const statusColor = (active: boolean) => active
    ? { color: '#3B6D11', background: '#EAF3DE' }
    : { color: '#A32D2D', background: '#FCEBEB' };

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: '36px', borderBottom: '0.5px solid #DDD6C4', paddingBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: 500, color: '#1C2B1A' }}>Users</h1>
        <p style={{ fontSize: '14px', color: '#8a7e6a', fontStyle: 'italic', marginTop: '4px' }}>
          Manage all registered accounts.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '20px' }}>

        {/* Users table */}
        <div style={{ background: '#fff', border: '0.5px solid #DDD6C4', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #DDD6C4' }}>
                {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 18px', fontSize: '10px', color: '#8a7e6a', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#8a7e6a', fontStyle: 'italic' }}>Loading...</td></tr>
              ) : users.map((user: User) => (
                <tr
                  key={user.id}
                  style={{ borderBottom: '0.5px solid #EDE8DE', background: selected?.id === user.id ? '#FAF7F2' : '#fff', cursor: 'pointer' }}
                  onClick={() => { setSelected(user); setShowHistory(false); }}
                >
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '14px', color: '#1C2B1A' }}>{user.email}</div>
                    {user.fullName && <div style={{ fontSize: '12px', color: '#8a7e6a', fontStyle: 'italic' }}>{user.fullName}</div>}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {user.isAdmin
                      ? <span style={{ fontSize: '11px', color: '#8B6914', background: '#F5EDD6', padding: '2px 10px', borderRadius: '20px' }}>Admin</span>
                      : <span style={{ fontSize: '13px', color: '#8a7e6a' }}>User</span>}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px', ...statusColor(user.isActive) }}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '13px', color: '#8a7e6a' }}>
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {user.isActive
                        ? <button onClick={e => { e.stopPropagation(); deactivate.mutate(user.id); }} style={btnStyle('#A32D2D', '#FCEBEB')}>Disable</button>
                        : <button onClick={e => { e.stopPropagation(); activate.mutate(user.id); }} style={btnStyle('#3B6D11', '#EAF3DE')}>Activate</button>}
                      <button onClick={e => { e.stopPropagation(); resetKey.mutate(user.id); }} style={btnStyle('#8B6914', '#F5EDD6')}>Reset Key</button>
                      <button onClick={e => { e.stopPropagation(); if (confirm('Delete this user?')) remove.mutate(user.id); }} style={btnStyle('#fff', '#A32D2D')}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* User detail panel */}
        {selected && (
          <div style={{ background: '#fff', border: '0.5px solid #DDD6C4', borderRadius: '8px', padding: '24px', alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: '#1C2B1A' }}>Account Detail</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#8a7e6a', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={labelStyle}>Email</div>
                <div style={{ fontSize: '14px', color: '#1C2B1A' }}>{selected.email}</div>
              </div>
              <div>
                <div style={labelStyle}>Full Name</div>
                <div style={{ fontSize: '14px', color: '#1C2B1A' }}>{selected.fullName || '—'}</div>
              </div>
              <div>
                <div style={labelStyle}>API Key</div>
                <code style={{ fontSize: '11px', color: '#5C7A58', background: '#EAF0E8', padding: '4px 8px', borderRadius: '4px', wordBreak: 'break-all' as const }}>
                  {selected.apiKey || '—'}
                </code>
              </div>
              <div>
                <div style={labelStyle}>Status</div>
                <span style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '20px', ...statusColor(selected.isActive) }}>
                  {selected.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div>
                <div style={labelStyle}>Member Since</div>
                <div style={{ fontSize: '14px', color: '#1C2B1A' }}>{format(new Date(selected.createdAt), 'MMMM d, yyyy')}</div>
              </div>
            </div>

            <div style={{ borderTop: '0.5px solid #EDE8DE', marginTop: '20px', paddingTop: '20px' }}>
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{ fontSize: '13px', color: '#1C2B1A', background: 'none', border: '0.5px solid #DDD6C4', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', width: '100%', fontFamily: 'EB Garamond, serif', letterSpacing: '0.04em' }}
              >
                {showHistory ? 'Hide' : 'View'} Subscription History
              </button>

              {showHistory && history.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {history.map((sub: Subscription) => (
                    <div key={sub.id} style={{ background: '#FAF7F2', border: '0.5px solid #EDE8DE', borderRadius: '6px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#5C7A58', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{sub.plan}</span>
                        <span style={{ fontSize: '11px', color: '#8a7e6a' }}>${sub.price}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#8a7e6a', fontStyle: 'italic' }}>
                        {sub.status} · {sub.callsUsed}/{sub.maxCalls === -1 ? '∞' : sub.maxCalls} calls
                      </div>
                      {sub.expiresAt && (
                        <div style={{ fontSize: '11px', color: '#8a7e6a', marginTop: '2px' }}>
                          Expires: {format(new Date(sub.expiresAt), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}