import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { Card } from '../ui';
import type { OPDStatistics } from '../../types';
import styles from './OPDStatisticsCard.module.css';

interface OPDStatisticsCardProps {
  statistics: OPDStatistics | null;
  loading: boolean;
}

export const OPDStatisticsCard: React.FC<OPDStatisticsCardProps> = ({
  statistics,
  loading,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/ehs/opd-details');
  };
  if (loading) {
    return (
      <Card className={styles.card}>
        <div className={styles.header}>
          <h3><ClipboardList size={18} className={styles.headerIcon} /> OPD Visits Today</h3>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.skeleton}></div>
          <div className={styles.skeleton}></div>
        </div>
      </Card>
    );
  }

  if (!statistics) {
    return null;
  }

  const hasVisitsToday = statistics.visits.length > 0;

  return (
    <Card className={styles.card} onClick={handleClick}>
      <div className={styles.header}>
        <h3><ClipboardList size={18} className={styles.headerIcon} /> OPD Visits Today</h3>
        <div className={styles.todayBadge}>{statistics.today_count}</div>
      </div>

      {hasVisitsToday ? (
        <div className={styles.tableContainer}>
          <table className={styles.visitsTable}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Time</th>
                <th>Complaint</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {statistics.visits.slice(0, 5).map((visit) => (
                <tr key={visit.id}>
                  <td>
                    <div className={styles.employeeName}>{visit.employee_name}</div>
                    <div className={styles.employeeCode}>{visit.employee_code}</div>
                  </td>
                  <td>{visit.department}</td>
                  <td>{new Date(visit.visit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className={styles.complaint}>{visit.chief_complaint || '-'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[visit.status.toLowerCase()]}`}>
                      {visit.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {statistics.visits.length > 5 && (
            <div className={styles.viewMore}>
              +{statistics.visits.length - 5} more visits today
            </div>
          )}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><ClipboardList size={48} /></div>
          <p>No OPD visits recorded today</p>
          <span className={styles.emptyHint}>Visit activity will appear here when employees check in</span>
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.totalLabel}>Total OPD Cases</span>
        <span className={styles.totalValue}>{statistics.till_date_count}</span>
      </div>
    </Card>
  );
};
