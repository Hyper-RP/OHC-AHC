import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getNavItemsForRole } from '../../utils/navigation';
import styles from './Sidebar.module.css';

interface SidebarProps {
  className?: string;
}

/**
 * Sidebar component for main navigation
 * Displays navigation items based on user role
 */
export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const navItems = getNavItemsForRole(user.role);
  const userDisplayName = `${user.first_name} ${user.last_name}`;

  return (
    <aside className={`${styles.sidebar} ${className}`}>
      <div className={styles.sidebarTop}>
        <div className={styles.brandSection}>
          <div className={styles.brandMark}>OHC</div>
          <h1 className={styles.brandTitle}>Health Portal</h1>
          <p className={styles.brandSubtitle}>Occupational Health Center</p>
        </div>

        <nav className={styles.portalNav}>
          {navItems.map((item) => (
            <NavLink
              key={item.urlName}
              to={item.url}
              className={({ isActive }) =>
                `${styles.navLinkCard} ${isActive ? styles.active : ''}`
              }
              end
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className={styles.sidebarFooter}>
        <div className={styles.userSection}>
          <div className={styles.roleChip}>{user.role}</div>
          <p className={styles.userName}>{userDisplayName}</p>
        </div>
        <button type="button" className={styles.logoutButton} onClick={logout}>
          Logout
        </button>
      </div>
    </aside>
  );
};
