import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  FiGrid, FiUser, FiBookmark, FiCreditCard, FiBell, FiUsers,
  FiBriefcase, FiShield, FiTag, FiStar, FiLogOut, FiMessageSquare,
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import HourlyRatePrompt from '../candidate/HourlyRatePrompt';
import logo from '../../assets/logo.png';
import './DashboardLayout.css';

const NAV_CONFIG = {
  candidate: [
    { to: '/candidate/dashboard', label: 'Overview', icon: FiGrid, end: true },
    { to: '/candidate/dashboard/profile', label: 'My Profile', icon: FiUser },
    { to: '/candidate/dashboard/engagements', label: 'My Engagements', icon: FiBriefcase },
    { to: '/candidate/dashboard/notifications', label: 'Notifications', icon: FiBell },
  ],
  company: [
    { to: '/company/dashboard', label: 'Overview', icon: FiGrid, end: true },
    { to: '/company/dashboard/profile', label: 'Company Profile', icon: FiBriefcase },
    { to: '/company/dashboard/bookmarks', label: 'Bookmarked', icon: FiBookmark },
    { to: '/company/dashboard/payments', label: 'Payment History', icon: FiCreditCard },
    { to: '/company/dashboard/notifications', label: 'Notifications', icon: FiBell },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Overview', icon: FiGrid, end: true },
    { to: '/admin/dashboard/users', label: 'Users', icon: FiUsers },
    { to: '/admin/dashboard/candidates', label: 'Candidates', icon: FiUser },
    { to: '/admin/dashboard/companies', label: 'Companies', icon: FiBriefcase },
    { to: '/admin/dashboard/payments', label: 'Payments', icon: FaRupeeSign },
    { to: '/admin/dashboard/communications', label: 'Communications', icon: FiMessageSquare },
    { to: '/admin/dashboard/verifications', label: 'Verification', icon: FiShield },
    { to: '/admin/dashboard/taxonomy', label: 'Categories & Skills', icon: FiTag },
    { to: '/admin/dashboard/reviews', label: 'Reviews', icon: FiStar },
  ],
};

/**
 * Generic dashboard shell shared by all three roles. The nav items shown
 * are derived from the current user's role so one layout component
 * serves candidate, company, and admin dashboards alike.
 */
export default function DashboardLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = NAV_CONFIG[role] || [];

  const [showRatePrompt, setShowRatePrompt] = useState(false);

  useEffect(() => {
    if (role === 'candidate' && (user?.hourlyRate === null || user?.hourlyRate === undefined)) {
      setShowRatePrompt(true);
    } else {
      setShowRatePrompt(false);
    }
  }, [role, user?.hourlyRate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="dashboard-shell">
      {role === 'candidate' && (
        <HourlyRatePrompt open={showRatePrompt} onClose={() => setShowRatePrompt(false)} />
      )}
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <img src={logo} alt="HourlyRecruit Tech Labs" />
        </div>
        <div className="dashboard-user">
          <div className="dashboard-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <p className="dashboard-user-name">{user?.name}</p>
            <p className="dashboard-user-role text-muted">{role}</p>
          </div>
        </div>
        <nav className="dashboard-nav">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="dashboard-nav-link">
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="dashboard-logout" onClick={handleLogout}>
          <FiLogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      <div className="dashboard-content">
        <div key={location.pathname} className="fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
