import React, { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Role } from '../../types';

import styles from './NavDropdown.module.css';

interface NavDropdownProps {
  label: string;
  icon: string;
  url: string;
  isOpen?: boolean;
  onToggle?: () => void;
  children: NavSubItem[];
}

interface NavSubItem {
  label: string;
  url: string;
  roles: Role[];
  icon?: string;
}

export const NavDropdown: React.FC<NavDropdownProps> = ({
  label,
  icon,
  url,
  isOpen: controlledOpen,
  onToggle,
  children,
}) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = controlledOpen ?? internalOpen;

  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen(!isOpen);
    }
  };

  const getFilteredChildren = (): NavSubItem[] => {
    if (!user) return [];
    return children.filter(child => child.roles.includes(user.role as Role));
  };

  const filteredChildren = getFilteredChildren();

  return (
    <div className={styles.navDropdown} ref={dropdownRef}>
      <NavLink
        to={url}
        className={styles.navDropdownTrigger}
        onClick={(e) => {
          e.preventDefault();
          toggleDropdown();
        }}
      >
        <span className={styles.navIcon}>{icon}</span>
        <span>{label}</span>
        <span className={`${styles.dropdownArrow} ${isOpen ? styles.open : ''}`}>▼</span>
      </NavLink>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {filteredChildren.length > 0 ? (
            filteredChildren.map((child, index) => (
              <NavLink
                key={`${child.url}-${index}`}
                to={child.url}
                className={styles.dropdownItem}
              >
                {child.icon && (
                  <span className={styles.navIcon}>{child.icon}</span>
                )}
                <span className={styles.navLabel}>{child.label}</span>
              </NavLink>
            ))
          ) : (
            <div className={styles.noAccess}>No access</div>
          )}
        </div>
      )}
    </div>
  );
};

export const NavSubItem: React.FC<{ label: string; url: string; icon?: string; roles: Role[] }> = ({
  label,
  url,
  icon,
  roles,
}) => {
  const { user } = useAuth();

  const hasAccess = !user || roles.includes(user.role as Role);

  if (!hasAccess) {
    return null;
  }

  return (
    <NavLink
      to={url}
      className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
      end
    >
      {icon && <span className={styles.navIcon}>{icon}</span>}
      <span>{label}</span>
    </NavLink>
  );
};