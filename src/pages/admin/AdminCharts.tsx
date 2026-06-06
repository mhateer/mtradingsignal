import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { refreshCharts, getChartSnapshots } from '../../api/admin';
import toast from 'react-hot-toast';
import { RefreshCw, TrendingUp, Target, BarChart2, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminCharts() {
    const qc = useQueryClient();
    const [, setLastRefreshed] = useState<string | null>(null);

    const { data: snapshots, isLoading } = useQuery({
        queryKey: ['chart-snapshots'],
        queryFn: getChartSnapshots,
    });

    const refreshMutation = useMutation({
        mutationFn: refreshCharts,
        onSuccess: () => {
            setLastRefreshed(new Date().toISOString());
            toast.success('Charts refreshed successfully. Landing page will update immediately.');
            qc.invalidateQueries({ queryKey: ['chart-snapshots'] });
        },
        onError: () => toast.error('Failed to refresh charts'),
    });

    const stats = snapshots?.stats?.data;
    const backtest = snapshots?.backtest?.data;
    const direction = snapshots?.direction?.data;
    const updatedAt = snapshots?.stats?.updatedAt;

    return (
        <div style={{ padding: '40px' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '24px', color: 'var(--green-deep)', margin: '0 0 6px' }}>
                        Chart Management
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Refresh to update landing page charts with latest signal data
                    </p>
                </div>

                <button
                    onClick={() => refreshMutation.mutate()}
                    disabled={refreshMutation.isPending}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'var(--green-deep)', color: 'var(--gold)',
                        border: 'none', borderRadius: '8px', padding: '12px 24px',
                        cursor: refreshMutation.isPending ? 'not-allowed' : 'pointer',
                        fontFamily: 'Playfair Display, Georgia, serif', fontSize: '14px',
                        opacity: refreshMutation.isPending ? 0.7 : 1,
                    }}
                >
                    <RefreshCw size={16} style={{ animation: refreshMutation.isPending ? 'spin 1s linear infinite' : 'none' }} />
                    {refreshMutation.isPending ? 'Fetching from Yahoo Finance...' : 'Refresh Charts'}
                </button>
            </div>

            {/* Last updated */}
            {updatedAt && (
                <div style={{ background: '#EAF3DE', border: '0.5px solid #c5ddb0', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} style={{ color: '#3B6D11' }} />
                    <span style={{ fontSize: '13px', color: '#3B6D11' }}>
                        Last updated: {format(new Date(updatedAt), 'MMM d, yyyy HH:mm')} UTC
                    </span>
                </div>
            )}

            {isLoading ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Loading snapshots...</p>
            ) : !stats ? (
                <div style={{ background: '#fff', border: '0.5px solid var(--border)', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
                    <BarChart2 size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                    <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: 'var(--green-deep)' }}>No chart data yet</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                        Click "Refresh Charts" to generate the first snapshot
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#fff', border: '0.5px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <Target size={16} style={{ color: 'var(--green-deep)' }} />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Direction Accuracy</span>
                        </div>
                        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', color: 'var(--green-deep)' }}>
                            {stats.directionAccuracy}%
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                            {direction?.correctSignals} correct of {direction?.totalSignals} traded signals
                        </div>
                    </div>

                    <div style={{ background: '#fff', border: '0.5px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <TrendingUp size={16} style={{ color: 'var(--green-deep)' }} />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>30-Day Backtest Return</span>
                        </div>
                        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', color: backtest?.totalReturn >= 0 ? '#3B6D11' : '#A32D2D' }}>
                            {backtest?.totalReturn >= 0 ? '+' : ''}{backtest?.totalReturn}%
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                            Win rate: {backtest?.winRate}% · {backtest?.totalTrades} trades
                        </div>
                    </div>

                    <div style={{ background: '#fff', border: '0.5px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <BarChart2 size={16} style={{ color: 'var(--green-deep)' }} />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Signal Distribution</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                            {[
                                { label: 'LONG', count: stats.longCount, color: '#3B6D11', bg: '#EAF3DE' },
                                { label: 'SHORT', count: stats.shortCount, color: '#A32D2D', bg: '#FCEBEB' },
                                { label: 'FLAT', count: stats.flatCount, color: '#8a7e6a', bg: '#F5F0E8' },
                            ].map(({ label, count, color, bg }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 600, color, background: bg, padding: '2px 8px', borderRadius: '20px', minWidth: '48px', textAlign: 'center' }}>{label}</span>
                                    <div style={{ flex: 1, background: '#EDE8DE', borderRadius: '4px', height: '6px' }}>
                                        <div style={{ height: '100%', width: `${Math.round((count / stats.totalSignalsGenerated) * 100)}%`, background: color, borderRadius: '4px' }} />
                                    </div>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '32px' }}>{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div style={{ background: '#F5EDD6', border: '0.5px solid #e8d9a8', borderRadius: '8px', padding: '16px 20px' }}>
                <div style={{ fontSize: '11px', color: '#8B6914', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>How It Works</div>
                <p style={{ fontSize: '13px', color: '#8B6914', fontStyle: 'italic', margin: 0, lineHeight: '1.6' }}>
                    Clicking "Refresh Charts" fetches the latest 30 working days of gold signals from the database,
                    cross-references with Yahoo Finance hourly OHLC data, computes direction accuracy and backtest equity curve,
                    then saves the snapshot. The landing page always displays data from the last refresh.
                    Recommended: refresh once daily after market close.
                </p>
            </div>

            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}