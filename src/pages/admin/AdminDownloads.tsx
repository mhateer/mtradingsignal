import { useQuery } from '@tanstack/react-query';
import { getAllDownloads } from '../../api/admin';
import { format } from 'date-fns';
import { Download } from 'lucide-react';

export default function AdminDownloads() {
  const { data: downloads = [], isLoading } = useQuery({
    queryKey: ['all-downloads'],
    queryFn: getAllDownloads,
    refetchInterval: 60000,
  });

  const uniqueUsers = new Set(downloads.map((d: any) => d.userId)).size;
  const today = downloads.filter((d: any) =>
    new Date(d.createdAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: '36px', borderBottom: '0.5px solid #DDD6C4', paddingBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: 500, color: '#1C2B1A' }}>
          Software Downloads
        </h1>
        <p style={{ fontSize: '14px', color: '#8a7e6a', fontStyle: 'italic', marginTop: '4px' }}>
          Track who downloaded the MTS Agent and when.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Downloads', value: downloads.length },
          { label: 'Unique Users', value: uniqueUsers },
          { label: 'Today', value: today },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#fff', border: '0.5px solid #DDD6C4', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '10px', color: '#8a7e6a', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '10px' }}>{label}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#1C2B1A' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '0.5px solid #DDD6C4', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '0.5px solid #EDE8DE', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={14} style={{ color: '#8a7e6a' }} />
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: '#1C2B1A' }}>Download Log</h2>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid #DDD6C4' }}>
              {['User', 'Version', 'Date & Time', 'IP Address'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: '10px', color: '#8a7e6a', letterSpacing: '0.12em', textTransform: 'uppercase' as const, fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#8a7e6a', fontStyle: 'italic' }}>Loading...</td></tr>
            ) : downloads.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#8a7e6a', fontStyle: 'italic' }}>No downloads yet.</td></tr>
            ) : downloads.map((d: any) => (
              <tr key={d.id} style={{ borderBottom: '0.5px solid #EDE8DE' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontSize: '14px', color: '#1C2B1A' }}>{d.user?.email || '—'}</div>
                  <div style={{ fontSize: '11px', color: '#8a7e6a', fontStyle: 'italic' }}>{d.user?.fullName || ''}</div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ fontSize: '11px', color: '#5C7A58', background: '#EAF0E8', padding: '2px 8px', borderRadius: '20px', fontFamily: 'monospace' }}>
                    {d.version}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: '#8a7e6a' }}>
                  {format(new Date(d.createdAt), 'MMM d, yyyy · HH:mm')}
                </td>
                <td style={{ padding: '14px 20px', fontSize: '12px', color: '#8a7e6a', fontFamily: 'monospace' }}>
                  {d.ipAddress || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}