import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
  ComposedChart, Bar, Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';

// ── Types ─────────────────────────────────────────────────────────────────────
interface RawPoint {
  time: string;
  signal: 'LONG' | 'SHORT' | 'FLAT';
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  favorablePct: number | null;
  adversePct: number | null;
  closePct: number | null;
  nyDate: string;
}

interface DirectionData {
  points: RawPoint[];
  allPoints: RawPoint[];
  updatedAt: string;
}

interface StatsData {
  totalSignalsGenerated: number;
  longCount: number;
  shortCount: number;
  flatCount: number;
  updatedAt: string;
}

interface ChartsSectionProps {
  directionData: DirectionData | null;
  statsData: StatsData | null;
}

// ── Pure calculation — runs on frontend with any TP/SL ───────────────────────
function calcBacktest(points: RawPoint[], tpPct: number, slPct: number) {
  const dayMap = new Map<string, RawPoint[]>();
  for (const p of points) {
    if (!p.open || p.signal === 'FLAT') continue;
    if (!dayMap.has(p.nyDate)) dayMap.set(p.nyDate, []);
    dayMap.get(p.nyDate)!.push(p);
  }

  const days = Array.from(dayMap.entries())
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-30);

  let cum = 0;
  let totalTrades = 0;
  let totalWins = 0;
  let totalTpHits = 0;
  let totalSlHits = 0;

  const curve: {
    date: string; cumReturn: number; dayReturn: number;
    trades: number; wins: number; tpHits: number; slHits: number;
  }[] = [];

  for (const [date, rows] of days) {
    let dayRet = 0;
    let trades = 0, wins = 0, tpHits = 0, slHits = 0;

    for (const p of rows) {
      if (!p.favorablePct || !p.adversePct || !p.closePct) continue;
      trades++;

      // TP hit: favorable move reached TP level
      if (p.favorablePct >= tpPct) {
        // Check if SL hit before TP (using adversePct as proxy)
        // Conservative: if adverse >= SL and adverse > favorable/2, SL hit first
        if (p.adversePct >= slPct && p.adversePct > p.favorablePct * 0.6) {
          dayRet -= slPct;
          slHits++;
        } else {
          dayRet += tpPct;
          wins++;
          tpHits++;
        }
      } else if (p.adversePct >= slPct) {
        // SL hit, TP not reached
        dayRet -= slPct;
        slHits++;
      } else {
        // Neither TP nor SL — close at hourly close
        dayRet += p.closePct;
        if (p.closePct > 0) wins++;
      }
    }

    cum += dayRet;
    totalTrades += trades;
    totalWins += wins;
    totalTpHits += tpHits;
    totalSlHits += slHits;

    curve.push({
      date,
      cumReturn: Math.round(cum * 100) / 100,
      dayReturn: Math.round(dayRet * 100) / 100,
      trades, wins, tpHits, slHits,
    });
  }

  const winRate = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0;

  return {
    curve,
    totalReturn: Math.round(cum * 100) / 100,
    winRate,
    totalTrades,
    totalWins,
    totalTpHits,
    totalSlHits,
  };
}

function calcAccuracy(points: RawPoint[], tpPct: number) {
  const traded = points.filter(p => p.signal !== 'FLAT' && p.open !== null && p.favorablePct !== null);
  const profitable = traded.filter(p => (p.favorablePct ?? 0) >= tpPct);
  return {
    accuracy: traded.length > 0 ? Math.round((profitable.length / traded.length) * 100) : 0,
    profitable: profitable.length,
    total: traded.length,
  };
}

// ── Tooltips ──────────────────────────────────────────────────────────────────
const EquityTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#0d1a0c', border: '1px solid #D4AF6A33',
      borderRadius: '8px', padding: '12px 16px',
      fontFamily: 'EB Garamond, Georgia, serif', minWidth: '180px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <div style={{ color: '#D4AF6A', fontSize: '11px', marginBottom: '8px', letterSpacing: '0.1em' }}>
        {d.date}
      </div>
      <div style={{ color: '#FAF7F2', fontSize: '16px', marginBottom: '4px' }}>
        {d.cumReturn >= 0 ? '+' : ''}{d.cumReturn}%
        <span style={{ fontSize: '11px', color: '#5C7A58', marginLeft: '6px' }}>cumulative</span>
      </div>
      <div style={{ color: d.dayReturn >= 0 ? '#7ec87e' : '#e07070', fontSize: '13px', marginBottom: '8px' }}>
        {d.dayReturn >= 0 ? '+' : ''}{d.dayReturn}% today
      </div>
      <div style={{ borderTop: '1px solid #D4AF6A15', paddingTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        <span style={{ fontSize: '11px', color: '#5C7A58' }}>Trades</span>
        <span style={{ fontSize: '11px', color: '#FAF7F2', textAlign: 'right' as const }}>{d.trades}</span>
        <span style={{ fontSize: '11px', color: '#5C7A58' }}>TP hits</span>
        <span style={{ fontSize: '11px', color: '#7ec87e', textAlign: 'right' as const }}>{d.tpHits}</span>
        <span style={{ fontSize: '11px', color: '#5C7A58' }}>SL hits</span>
        <span style={{ fontSize: '11px', color: '#e07070', textAlign: 'right' as const }}>{d.slHits}</span>
      </div>
    </div>
  );
};

const DirectionTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#0d1a0c', border: '1px solid #D4AF6A33',
      borderRadius: '8px', padding: '12px 16px',
      fontFamily: 'EB Garamond, Georgia, serif', minWidth: '200px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <div style={{ color: '#D4AF6A', fontSize: '11px', marginBottom: '8px', letterSpacing: '0.1em' }}>{d.label}</div>
      <div style={{ marginBottom: '8px' }}>
        <span style={{
          fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em',
          color: d.signal === 'LONG' ? '#7ec87e' : '#e07070',
          background: d.signal === 'LONG' ? '#7ec87e22' : '#e0707022',
          padding: '2px 8px', borderRadius: '4px',
        }}>{d.signal}</span>
      </div>
      {d.open && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '8px' }}>
          {[
            { label: 'Open', value: `$${d.open?.toFixed(2)}`, color: '#FAF7F2' },
            { label: 'High', value: `$${d.high?.toFixed(2)}`, color: '#7ec87e' },
            { label: 'Low', value: `$${d.low?.toFixed(2)}`, color: '#e07070' },
            { label: 'Close', value: `$${d.close?.toFixed(2)}`, color: '#FAF7F2' },
          ].map(({ label, value, color }) => (
            <>
              <span style={{ fontSize: '11px', color: '#5C7A58' }}>{label}</span>
              <span style={{ fontSize: '11px', color, textAlign: 'right' as const }}>{value}</span>
            </>
          ))}
        </div>
      )}
      <div style={{ borderTop: '1px solid #D4AF6A15', paddingTop: '8px' }}>
        <div style={{ fontSize: '12px', color: d.profitable ? '#7ec87e' : '#e07070', marginBottom: '2px' }}>
          {d.profitable ? '✓ TP reachable' : '✗ TP not reached'}
        </div>
        <div style={{ fontSize: '11px', color: '#5C7A58' }}>
          Favorable: +{d.favorablePct?.toFixed(2)}% · Adverse: -{d.adversePct?.toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

// ── Slider Component ──────────────────────────────────────────────────────────
function Slider({
  label, value, min, max, step, color, onChange, sublabel
}: {
  label: string; value: number; min: number; max: number;
  step: number; color: string; onChange: (v: number) => void; sublabel?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#8aaa84', letterSpacing: '0.1em' }}>{label}</span>
          {sublabel && <span style={{ fontSize: '11px', color: '#5C7A58', marginLeft: '6px', fontStyle: 'italic' }}>{sublabel}</span>}
        </div>
        <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '20px', color }}>{value}%</span>
      </div>
      <div style={{ position: 'relative', height: '4px', background: '#1e3a1c', borderRadius: '2px' }}>
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.1s' }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0, cursor: 'pointer', margin: 0,
          }}
        />
        <div style={{
          position: 'absolute', top: '50%', left: `${pct}%`,
          transform: 'translate(-50%, -50%)',
          width: '14px', height: '14px', borderRadius: '50%',
          background: color, border: '2px solid #0d1a0c',
          boxShadow: `0 0 8px ${color}88`,
          pointerEvents: 'none', transition: 'left 0.1s',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '10px', color: '#3a5a38' }}>{min}%</span>
        <span style={{ fontSize: '10px', color: '#3a5a38' }}>{max}%</span>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function ChartsSection({ directionData }: ChartsSectionProps) {
  const [tp, setTp] = useState(2);
  const [sl, setSl] = useState(1);

  const allPoints = directionData?.allPoints ?? [];
  const chartPoints = directionData?.points ?? [];
  const updatedAt = directionData?.updatedAt ? new Date(directionData.updatedAt) : null;

  // Recalculate everything when TP/SL changes
  const backtest = useMemo(() => calcBacktest(allPoints, tp, sl), [allPoints, tp, sl]);
  const accuracy = useMemo(() => calcAccuracy(allPoints, tp), [allPoints, tp]);

  // Direction bars — last 60 non-FLAT signals
  const directionBars = useMemo(() =>
    chartPoints
      .filter(p => p.signal !== 'FLAT' && p.open !== null)
      .slice(0, 60)
      .reverse()
      .map((p, i) => ({
        index: i,
        label: format(parseISO(p.time), 'MMM d HH:mm'),
        signal: p.signal,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        favorablePct: p.favorablePct,
        adversePct: p.adversePct,
        profitable: (p.favorablePct ?? 0) >= tp,
        // Bar height = favorable move % (capped at 2x TP for visual clarity)
        value: (p.favorablePct ?? 0) >= tp
          ? Math.min(p.favorablePct ?? 0, tp * 2)
          : -Math.min(p.adversePct ?? 0, sl * 2),
      })),
    [chartPoints, tp, sl]
  );

  const noData = allPoints.length === 0;

  return (
    <div style={{ fontFamily: 'EB Garamond, Georgia, serif' }}>

      {/* ── Section I: Signal Direction Accuracy ───────────────────────────── */}
      <section id="charts" style={{ padding: '100px 48px', background: '#FAF7F2' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{ fontSize: '10px', color: '#8a7e6a', letterSpacing: '0.2em', marginBottom: '10px' }}>CHART I · SIGNAL INTELLIGENCE</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '36px', color: '#1C2B1A', margin: 0, fontWeight: 400, lineHeight: 1.1 }}>
                  Signal Direction Accuracy
                </h2>
                <p style={{ color: '#8a7e6a', fontSize: '15px', fontStyle: 'italic', marginTop: '10px', maxWidth: '520px', lineHeight: 1.6 }}>
                  For LONG signals: measures if gold reached your TP above entry.
                  For SHORT signals: measures if gold reached your TP below entry.
                  Adjust TP to see how accuracy changes.
                </p>
              </div>

              {/* Live accuracy stat */}
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'Playfair Display, Georgia, serif',
                  fontSize: '56px', lineHeight: 1,
                  color: accuracy.accuracy >= 50 ? '#3B6D11' : '#A32D2D',
                  transition: 'color 0.3s',
                }}>
                  {noData ? '—' : `${accuracy.accuracy}%`}
                </div>
                <div style={{ fontSize: '11px', color: '#8a7e6a', letterSpacing: '0.1em', marginTop: '4px' }}>SIGNALS HIT TP</div>
                {!noData && (
                  <div style={{ fontSize: '13px', color: '#8a7e6a', fontStyle: 'italic', marginTop: '2px' }}>
                    {accuracy.profitable} of {accuracy.total} traded signals
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TP Slider for Chart I */}
          <div style={{
            background: '#1C2B1A', borderRadius: '12px', padding: '24px 32px',
            marginBottom: '24px', border: '1px solid #D4AF6A15',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D4AF6A', boxShadow: '0 0 8px #D4AF6A88' }} />
              <span style={{ fontSize: '11px', color: '#5C7A58', letterSpacing: '0.12em' }}>
                TAKE PROFIT THRESHOLD — drag to see how accuracy changes
              </span>
            </div>
            <Slider
              label="Take Profit (TP)"
              sublabel="minimum favorable move to count as profitable"
              value={tp} min={0.1} max={10} step={0.1}
              color="#D4AF6A"
              onChange={setTp}
            />
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#5C9E55' }} />
              <span style={{ fontSize: '12px', color: '#8a7e6a' }}>TP reached — profitable signal</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#C25B5B' }} />
              <span style={{ fontSize: '12px', color: '#8a7e6a' }}>TP not reached</span>
            </div>
            <div style={{ fontSize: '12px', color: '#8a7e6a', fontStyle: 'italic', marginLeft: 'auto' }}>
              Bar height = favorable move % · Last 60 non-FLAT signals · NY hours only
            </div>
          </div>

          {/* Direction Bar Chart */}
          <div style={{ background: '#1C2B1A', borderRadius: '12px', padding: '32px', border: '1px solid #D4AF6A15' }}>
            {noData ? (
              <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5C7A58', fontStyle: 'italic' }}>
                Chart data will appear after admin refreshes
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={directionBars} barSize={10} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a1c" vertical={false} />
                  <XAxis dataKey="index" hide />
                  <YAxis
                    tick={{ fill: '#5C7A58', fontSize: 11 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
                  />
                  <Tooltip content={<DirectionTooltip />} cursor={{ fill: '#D4AF6A06' }} />
                  <ReferenceLine y={0} stroke="#D4AF6A33" strokeDasharray="4 4" />
                  {/* TP reference line */}
                  <ReferenceLine y={tp} stroke="#D4AF6A55" strokeDasharray="2 4"
                    label={{ value: `TP ${tp}%`, fill: '#D4AF6A88', fontSize: 10, position: 'right' }} />
                  {/* SL reference line */}
                  <ReferenceLine y={-sl} stroke="#e0707055" strokeDasharray="2 4"
                    label={{ value: `SL ${sl}%`, fill: '#e0707088', fontSize: 10, position: 'right' }} />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {directionBars.map((entry, i) => (
                      <Cell key={i} fill={entry.profitable ? '#5C9E55' : '#C25B5B'}
                        fillOpacity={entry.profitable ? 0.9 : 0.7} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {updatedAt && (
            <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '11px', color: '#8a7e6a', fontStyle: 'italic' }}>
              Data last updated: {format(updatedAt, "MMMM d, yyyy 'at' HH:mm")} UTC
            </div>
          )}
        </div>
      </section>

      {/* ── Section II: Interactive Backtest ────────────────────────────────── */}
      <section id="backtest" style={{ padding: '100px 48px', background: '#0f1f0e' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{ fontSize: '10px', color: '#5C7A58', letterSpacing: '0.2em', marginBottom: '10px' }}>CHART II · 30-DAY BACKTEST</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '36px', color: '#FAF7F2', margin: 0, fontWeight: 400, lineHeight: 1.1 }}>
                  Paper Trading Simulation
                </h2>
                <p style={{ color: '#5C7A58', fontSize: '15px', fontStyle: 'italic', marginTop: '10px', maxWidth: '520px', lineHeight: 1.6 }}>
                  Simulate 30 NY trading days following every LONG & SHORT signal.
                  Drag TP and SL to find your optimal risk/reward ratio in real-time.
                </p>
              </div>

              {/* Return stat */}
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'Playfair Display, Georgia, serif',
                  fontSize: '56px', lineHeight: 1,
                  color: backtest.totalReturn >= 0 ? '#7ec87e' : '#e07070',
                  transition: 'color 0.3s',
                }}>
                  {noData ? '—' : `${backtest.totalReturn >= 0 ? '+' : ''}${backtest.totalReturn}%`}
                </div>
                <div style={{ fontSize: '11px', color: '#5C7A58', letterSpacing: '0.1em', marginTop: '4px' }}>30-DAY RETURN</div>
                {!noData && (
                  <div style={{ fontSize: '13px', color: '#5C7A58', fontStyle: 'italic', marginTop: '2px' }}>
                    {backtest.winRate}% win rate · {backtest.totalTrades} trades
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TP/SL Sliders */}
          <div style={{
            background: '#1C2B1A', borderRadius: '12px', padding: '28px 32px',
            marginBottom: '24px', border: '1px solid #D4AF6A15',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7ec87e', boxShadow: '0 0 8px #7ec87e88' }} />
                <span style={{ fontSize: '11px', color: '#5C7A58', letterSpacing: '0.12em' }}>TAKE PROFIT</span>
              </div>
              <Slider label="TP" sublabel="exit when this profit is reached" value={tp} min={0.1} max={10} step={0.1} color="#7ec87e" onChange={setTp} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e07070', boxShadow: '0 0 8px #e0707088' }} />
                <span style={{ fontSize: '11px', color: '#5C7A58', letterSpacing: '0.12em' }}>STOP LOSS</span>
              </div>
              <Slider label="SL" sublabel="exit when this loss is reached" value={sl} min={0.1} max={10} step={0.1} color="#e07070" onChange={setSl} />
            </div>
          </div>

          {/* Stats row */}
          {!noData && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '12px', marginBottom: '24px',
            }}>
              {[
                { label: 'Total Return', value: `${backtest.totalReturn >= 0 ? '+' : ''}${backtest.totalReturn}%`, color: backtest.totalReturn >= 0 ? '#7ec87e' : '#e07070' },
                { label: 'Win Rate', value: `${backtest.winRate}%`, color: '#D4AF6A' },
                { label: 'Total Trades', value: backtest.totalTrades, color: '#FAF7F2' },
                { label: 'TP Hits', value: backtest.totalTpHits, color: '#7ec87e' },
                { label: 'SL Hits', value: backtest.totalSlHits, color: '#e07070' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  background: '#1C2B1A', border: '1px solid #D4AF6A15',
                  borderRadius: '8px', padding: '16px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '24px', color, marginBottom: '4px' }}>{value}</div>
                  <div style={{ fontSize: '10px', color: '#5C7A58', letterSpacing: '0.1em' }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Equity Curve */}
          <div style={{ background: '#1C2B1A', borderRadius: '12px', padding: '32px', border: '1px solid #D4AF6A15' }}>
            {noData ? (
              <div style={{ height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5C7A58', fontStyle: 'italic' }}>
                Backtest data will appear after admin refreshes
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <AreaChart data={backtest.curve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="posGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7ec87e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#7ec87e" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="negGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e07070" stopOpacity={0.02} />
                      <stop offset="95%" stopColor="#e07070" stopOpacity={0.25} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a1c" />
                  <XAxis
                    dataKey="date" tick={{ fill: '#5C7A58', fontSize: 11 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={d => { try { return format(new Date(d), 'MMM d'); } catch { return d; } }}
                    interval={Math.max(0, Math.floor(backtest.curve.length / 7))}
                  />
                  <YAxis
                    tick={{ fill: '#5C7A58', fontSize: 11 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`}
                  />
                  <Tooltip content={<EquityTooltip />} />
                  <ReferenceLine y={0} stroke="#D4AF6A33" strokeDasharray="4 4" />
                  <Area
                    type="monotone" dataKey="cumReturn"
                    stroke={backtest.totalReturn >= 0 ? '#7ec87e' : '#e07070'}
                    strokeWidth={2}
                    fill={backtest.totalReturn >= 0 ? 'url(#posGradient)' : 'url(#negGradient)'}
                    dot={false}
                    activeDot={{ r: 4, fill: backtest.totalReturn >= 0 ? '#7ec87e' : '#e07070', stroke: '#0d1a0c' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* TP/SL note */}
          <div style={{
            background: '#D4AF6A0A', border: '1px solid #D4AF6A22',
            borderRadius: '8px', padding: '16px 20px', marginTop: '20px',
            display: 'flex', alignItems: 'flex-start', gap: '12px',
          }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>💡</span>
            <p style={{ fontSize: '13px', color: '#8aaa84', fontStyle: 'italic', margin: 0, lineHeight: 1.7 }}>
              <strong style={{ color: '#D4AF6A' }}>Methodology:</strong> Each trade enters at hourly open.
              TP and SL are checked against intrabar high/low — if price touches TP level, trade exits at profit.
              If SL is hit first, trade exits at loss. Otherwise closed at hourly end.
              This represents mechanical signal-following. Skilled traders using discretion and position sizing
              can achieve substantially better results. Current settings: TP {tp}% / SL {sl}% (Risk:Reward = 1:{(tp / sl).toFixed(1)})
            </p>
          </div>

          {updatedAt && (
            <div style={{ textAlign: 'right', marginTop: '12px', fontSize: '11px', color: '#3a5a38', fontStyle: 'italic' }}>
              Data last updated: {format(updatedAt, "MMMM d, yyyy 'at' HH:mm")} UTC
            </div>
          )}
        </div>
      </section>
    </div>
  );
}