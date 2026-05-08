import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Snackbar } from '../ui';
import styles from './PortalLayout.module.css';

/**
 * Portal Layout component
 * Wraps all protected pages with sidebar and main content area
 */
export const PortalLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={styles.portalShell}>
      <Sidebar className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`} />
      <button
        type="button"
        className={styles.sidebarToggle}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <main className={styles.portalMain}>
        <Outlet />
      </main>
      <Snackbar />
    </div>
  );
};
