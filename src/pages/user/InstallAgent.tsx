import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getActiveSubscription } from '../../api/userAuth';
import { downloadAgent } from '../../api/software';
import { useUserAuthStore } from '../../store/userAuthStore';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const AGENT_VERSION = 'v1.0.0';
const AGENT_FILE_SIZE = '109 MB';

const cardStyle = { background: '#fff', border: '0.5px solid #DDD6C4', borderRadius: '8px', padding: '24px' };

const steps = [
  {
    num: '01',
    title: 'Sign In',
    desc: 'Open the app and sign in using your mTradingSignal email and password — the same credentials you use on this website. There is no separate signup.',
    img: null,
  },
  {
    num: '02',
    title: 'Connect MT5',
    desc: 'Enter your MetaTrader 5 terminal path, broker account number, password, and server name. Click "Test Connection" to verify the agent can communicate with your MT5 terminal.',
    img: null,
  },
  {
    num: '03',
    title: 'Configure Agent Settings',
    desc: 'Set your lot size, take-profit and stop-loss (in pips or dollars), daily profit target, and daily max loss. These control how the agent trades on your behalf.',
    img: null,
  },
  {
    num: '04',
    title: 'Run the Agent',
    desc: 'Click "Run Agent" to start. The agent automatically trades only during New York market hours (9:30 AM – 4:30 PM, Monday–Friday) and shows "Market Closed" outside these hours.',
    img: null,
  },
  {
    num: '05',
    title: 'Monitor Your Dashboard',
    desc: "View live agent status, today's P&L, current open trade, and full trade history — all stored locally on your device for your privacy.",
    img: null,
  },
];

export default function InstallAgent() {
  const navigate = useNavigate();
  const { user } = useUserAuthStore();
  const [downloading, setDownloading] = useState(false);

  const { data: activeSub, isLoading } = useQuery({
    queryKey: ['active-sub'],
    queryFn: getActiveSubscription,
  });

  const hasAgentAccess = activeSub?.status === 'active' &&
    (activeSub?.plan === 'pro' || activeSub?.plan === 'enterprise');

  useEffect(() => {
    if (!isLoading && !hasAgentAccess) {
      navigate('/dashboard');
    }
  }, [isLoading, hasAgentAccess, navigate]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadAgent();
      toast.success('Download started');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8a7e6a', fontStyle: 'italic' }}>Loading...</p>
      </div>
    );
  }

  if (!hasAgentAccess) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>

      {/* Nav */}
      <nav style={{ background: '#1C2B1A', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '56px', flexWrap: 'wrap' as const, gap: '8px' }}>
        <a href="/" style={{ textDecoration: 'none' }}><div style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: '#D4AF6A', letterSpacing: '0.04em' }}>mTradingSignal</div></a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/dashboard" style={{ fontSize: '13px', color: '#8aaa84', textDecoration: 'none', fontFamily: 'EB Garamond, serif' }}>
            ← Back to Dashboard
          </Link>
          <span style={{ fontSize: '13px', color: '#8aaa84', fontFamily: 'EB Garamond, serif' }}>{user?.email}</span>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#7ec87e', boxShadow: '0 0 10px #7ec87e', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#3B6D11', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
              Agent Access Active — {activeSub?.plan} Plan
            </span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: 500, color: '#1C2B1A' }}>
            mTradingSignal Agent
          </h1>
          <p style={{ fontSize: '14px', color: '#8a7e6a', fontStyle: 'italic', marginTop: '4px' }}>
            Automated MT5 trading powered by your gold signals — runs locally on your Windows machine.
          </p>
        </div>

        {/* Download Card */}
        <div style={{
          background: '#1C2B1A', border: '1px solid #D4AF6A22', borderRadius: '8px',
          padding: '24px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap' as const, gap: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: '#D4AF6A15', border: '1px solid #D4AF6A33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>
              🪟
            </div>
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#FAF7F2', marginBottom: '4px' }}>
                Download for Windows
              </div>
              <div style={{ fontSize: '12px', color: '#8aaa84', display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
                <span>Version {AGENT_VERSION}</span>
                <span>·</span>
                <span>{AGENT_FILE_SIZE}</span>
                <span>·</span>
                <span>Windows 10/11 (64-bit)</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              background: downloading ? '#8B6914' : '#D4AF6A',
              color: '#1C2B1A', border: 'none', borderRadius: '6px',
              padding: '13px 28px', fontSize: '14px', fontFamily: 'Playfair Display, serif',
              letterSpacing: '0.04em', cursor: downloading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap' as const, display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}
          >
            {downloading ? 'Preparing download...' : `⬇ Download ${AGENT_VERSION}`}
          </button>
        </div>

        {/* Before you install */}
        <div style={{ ...cardStyle, marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: '#1C2B1A', marginBottom: '14px' }}>
            Before You Install
          </h2>
          <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Operating System', value: 'Windows 10 or 11 (64-bit)' },
              { label: 'Required Software', value: 'MetaTrader 5 (any broker)' },
              { label: 'Subscription', value: 'Pro or Enterprise plan, active' },
              { label: 'Internet', value: 'Stable connection during trading hours' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: '10px', color: '#8a7e6a', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '14px', color: '#1C2B1A' }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#F5EDD6', border: '0.5px solid #e8d9a8', borderRadius: '6px', padding: '14px', marginTop: '18px', fontSize: '13px', color: '#8B6914', fontStyle: 'italic' }}>
            ⚠ The trading engine requires MetaTrader 5 installed on your Windows machine. The agent does not place trades without an active, connected MT5 terminal.
          </div>
        </div>

        {/* How to use */}
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#1C2B1A', marginBottom: '4px' }}>
          How to Use the Agent
        </h2>
        <p style={{ fontSize: '13px', color: '#8a7e6a', fontStyle: 'italic', marginBottom: '24px' }}>
          A walkthrough of every screen in the application.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px', marginBottom: '32px' }}>
          {steps.map(step => (
            <div key={step.num} style={cardStyle}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' as const }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', color: '#D4AF6A33', lineHeight: 1, flexShrink: 0, minWidth: '48px' }}>
                  {step.num}
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: '#1C2B1A', marginBottom: '6px' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#8a7e6a', lineHeight: 1.7 }}>{step.desc}</p>
                  {step.img ? (
                    <img src={step.img} alt={step.title} style={{ width: '100%', borderRadius: '6px', marginTop: '14px', border: '1px solid #DDD6C4' }} />
                  ) : (
                    <div style={{ marginTop: '14px', borderRadius: '6px', border: '1px dashed #DDD6C4', background: '#FAF7F2', padding: '40px', textAlign: 'center' as const }}>
                      <span style={{ fontSize: '12px', color: '#C8BFA8', fontStyle: 'italic' }}>Screenshot coming soon</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: '#1C2B1A', marginBottom: '14px' }}>
            Important Notes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
            {[
              { q: 'Where is my data stored?', a: 'All trade history, action logs, and MT5 credentials are stored locally on your device, encrypted. Nothing is sent to our servers except a weekly total-profit figure used for billing.' },
              { q: 'What trading hours does the agent follow?', a: 'The agent only trades 9:30 AM – 4:30 PM New York time, Monday through Friday. Outside these hours it displays "Market Closed" and takes no action.' },
              { q: 'Can I use this on Mac?', a: 'The agent UI runs on macOS, but the MT5 trading engine requires Windows. Mac users should connect to a Windows VPS running MT5.' },
              { q: 'How do I update to a new version?', a: 'The app checks for updates automatically and will notify you when a new version is available.' },
            ].map((item, i, arr) => (
              <div key={i} style={{ borderBottom: i < arr.length - 1 ? '0.5px solid #EDE8DE' : 'none', paddingBottom: i < arr.length - 1 ? '12px' : 0 }}>
                <div style={{ fontSize: '14px', color: '#1C2B1A', fontFamily: 'Playfair Display, serif', marginBottom: '4px' }}>{item.q}</div>
                <div style={{ fontSize: '13px', color: '#8a7e6a', fontStyle: 'italic', lineHeight: 1.6 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}