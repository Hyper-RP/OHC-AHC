import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Button, FormInput, Alert } from '../ui';
import styles from './Login.module.css';

/**
 * Login page component
 * Handles user authentication with username/password
 */
export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { show } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the location user was trying to access
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);

    try {
      await login({ username, password });
      show('Login successful!', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      show('Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginShell}>
      <div className={styles.loginStack}>
        <div className={styles.loginCard}>
          <div className={styles.loginCardMain}>
            <div className={styles.loginLogoBlock}>
              <div className={styles.loginWordmark}>OHC-AHC</div>
              <p className={styles.loginCopy}>
                Occupational Health Center & Affiliate Hospital Care Portal
              </p>
            </div>

            {error && (
              <Alert type="danger" onDismiss={() => setError('')}>
                {error}
              </Alert>
            )}

            <form className={styles.loginForm} onSubmit={handleSubmit}>
              <div className={styles.loginField}>
                <FormInput
                  label="Username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={setUsername}
                  placeholder="Enter your username"
                  required
                  className={styles.loginInput}
                />
              </div>
              <div className={styles.loginField}>
                <FormInput
                  label="Password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter your password"
                  required
                  className={styles.loginInput}
                />
              </div>
              <Button
                type="submit"
                variant="brand"
                size="lg"
                loading={loading}
                className={styles.loginSubmit}
              >
                Sign In
              </Button>
            </form>
          </div>
          <div className={styles.loginCardSecondary}>
            <div className={styles.loginDivider}>
              <span></span>
              <strong>HELP</strong>
              <span></span>
            </div>
            <p className={styles.loginHelp}>
              Contact IT Support at <strong>support@ohc-ahc.com</strong> for login assistance
            </p>
            <p className={styles.loginMeta}>
              Roles: Admin, Nurse, EHS, HR, KAM, Doctor, Employee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
