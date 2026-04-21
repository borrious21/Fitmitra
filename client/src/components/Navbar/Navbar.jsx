import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Target, Calendar, User, LayoutDashboard } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import styles from './Navbar.module.css';
import NotificationBell from '../NotificationBell/NotificationBell';

const NAV_ITEMS = [
  { label: 'Today',    path: '/dashboard', icon: LayoutDashboard },
  { label: 'Progress', path: '/progress',  icon: Activity },
  { label: 'Plans',    path: '/plans',     icon: Calendar },
];

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const firstName = user?.name?.split(' ')[0] || 'User';
  const initials = firstName.slice(0, 2).toUpperCase();

  return (
    <nav className={styles.nav}>
      <div className={styles.navBlur} />
      
      <div className={styles.navContainer}>
        {/* Logo */}
        <Link to="/dashboard" className={styles.navLogo}>
          <div className={styles.logoIconBg}>
            <Activity className={styles.logoIcon} size={20} />
          </div>
          <span className={styles.navLogoWord}>FitMitra</span>
        </Link>

        {/* Navigation Tabs */}
        <div className={styles.navTabs}>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                className={`${styles.navTab} ${isActive ? styles.navTabActive : ''}`}
                onClick={() => navigate(item.path)}
              >
                <div className={styles.iconShift}>
                  <Icon size={18} className={styles.tabIcon} />
                </div>
                <span className={styles.tabLabel}>{item.label}</span>
                {isActive && <div className={styles.activeIndicator} />}
              </button>
            );
          })}
        </div>

        {/* Right Section */}
        <div className={styles.navRight}>
          <NotificationBell />
          <Link to="/profile" className={styles.navAvatarLink}>
            <div className={styles.navAvatar}>
              {user?.avatar_url || user?.profile_image ? (
                <img 
                  src={user.avatar_url || user.profile_image} 
                  alt="Avatar" 
                  className={styles.avatarImg} 
                  onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = initials; }}
                />
              ) : (
                initials
              )}
            </div>
          </Link>

          <button className={styles.logoutBtn} onClick={() => logout()}>
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;