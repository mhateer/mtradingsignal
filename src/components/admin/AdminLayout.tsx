import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, Users, CreditCard, FileText, BarChart2 } from 'lucide-react';
const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { to: '/admin/subscriptions', icon: FileText, label: 'Subscriptions' },
  { to: '/admin/charts', icon: BarChart2, label: 'Charts' },
  { to: '/admin/users', icon: Users, label: 'Users' },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div style={{ display: 'flex' }}>
      <aside style={{ width: '220px', minHeight: '100vh', background: '#1C2B1A', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <div style={{ padding: '24px 20px', borderBottom: '0.5px solid #2e4029' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', fontWeight: 500, color: '#D4AF6A', letterSpacing: '0.04em' }}>
            mTradingSignal
          </div>
          <div style={{ fontSize: '10px', color: '#5C7A58', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '4px' }}>
            Admin Portal
          </div>
        </div>

        <nav style={{ flex: 1, padding: '20px 12px' }}>
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center',
                padding: '10px 14px', borderRadius: '6px',
                fontSize: '14px', fontFamily: 'EB Garamond, serif',
                color: isActive ? '#D4AF6A' : '#8aaa84',
                background: isActive ? '#2e4029' : 'transparent',
                textDecoration: 'none', marginBottom: '2px',
                letterSpacing: '0.02em', transition: 'all 0.15s',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '0.5px solid #2e4029' }}>
          <div style={{ padding: '8px 14px', marginBottom: '4px' }}>
            <div style={{ fontSize: '12px', color: '#D4AF6A', fontFamily: 'EB Garamond, serif' }}>{user?.email}</div>
            <div style={{ fontSize: '10px', color: '#5C7A58', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>Administrator</div>
          </div>
          <button
            onClick={handleLogout}
            style={{ width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: '6px', background: 'transparent', border: 'none', color: '#5C7A58', fontSize: '13px', fontFamily: 'EB Garamond, serif', cursor: 'pointer', letterSpacing: '0.02em' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#A32D2D')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5C7A58')}
          >
            Sign Out →
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: '220px', minHeight: '100vh', background: '#FAF7F2', flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}