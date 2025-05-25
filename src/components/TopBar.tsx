"use client";

import { useState } from "react";
import { signOut, updatePassword, resetPassword, confirmResetPassword } from "aws-amplify/auth";
import { Menu } from "@aws-amplify/ui-react";
import styles from './TopBar.module.css';

interface TopBarProps {
  user?: any;
  onSignOut?: () => void;
  onSignInClick?: () => void;
  onDeleteAccount?: () => void;
}

export default function TopBar({ user, onSignOut, onSignInClick, onDeleteAccount }: TopBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetConfirmation, setIsResetConfirmation] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    email: '',
    resetCode: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  async function handleSignOut() {
    try {
      await signOut();
      if (onSignOut) onSignOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setResetMessage('');

    if (isForgotPassword) {
      if (!isResetConfirmation) {
        try {
          await resetPassword({
            username: passwordData.email
          });
          setIsResetConfirmation(true);
          setResetMessage('Check your email for a reset code');
        } catch (err: any) {
          setPasswordError(err.message || 'Failed to send reset code');
        }
      } else {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setPasswordError('New passwords do not match');
          return;
        }
        try {
          await confirmResetPassword({
            username: passwordData.email,
            confirmationCode: passwordData.resetCode,
            newPassword: passwordData.newPassword
          });
          // After successful reset, sign out the user
          await signOut();
          if (onSignOut) onSignOut();
        } catch (err: any) {
          setPasswordError(err.message || 'Failed to reset password');
        }
      }
    } else {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }

      try {
        await updatePassword({
          oldPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        });
        setShowPasswordReset(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          email: '',
          resetCode: ''
        });
      } catch (err: any) {
        setPasswordError(err.message || 'Failed to update password');
      }
    }
  }

  function resetPasswordModal() {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      email: '',
      resetCode: ''
    });
    setPasswordError('');
    setResetMessage('');
    setIsForgotPassword(false);
    setIsResetConfirmation(false);
  }

  // Get display name from user attributes
  const displayName = user?.attributes?.preferred_username || user?.username || "Guest";
  const userEmail = user?.attributes?.email;
  const avatarLetter = displayName !== "Guest" ? displayName[0].toUpperCase() : "G";

  return (
    <div className={styles.topbar}>
      <div className={styles.logo}>Aurium</div>
      <div className={styles.accountMenu}>
        {user ? (
          <>
            <button 
              className={styles.accountButton}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className={styles.username}>{displayName}</span>
              <span className={styles.avatar}>
                {avatarLetter}
              </span>
            </button>
            
            {isMenuOpen && (
              <div className={styles.menuDropdown}>
                <div className={styles.menuHeader}>
                  <span className={styles.menuUsername}>{displayName}</span>
                  <span className={styles.menuEmail}>{userEmail}</span>
                </div>
                <div className={styles.menuItems}>
                  <button 
                    className={styles.menuItem} 
                    onClick={() => {
                      setShowPasswordReset(true);
                      setIsMenuOpen(false);
                    }}
                  >
                    Change Password
                  </button>
                  <button className={styles.menuItem} onClick={handleSignOut}>
                    Sign Out
                  </button>
                  {onDeleteAccount && (
                    <button 
                      className={`${styles.menuItem} ${styles.menuItemDanger}`}
                      onClick={onDeleteAccount}
                    >
                      Delete Account
                    </button>
                  )}
                </div>
              </div>
            )}

            {showPasswordReset && (
              <div className={styles.modalOverlay}>
                <div className={styles.modal}>
                  <h3>{isForgotPassword ? 'Reset Password' : 'Change Password'}</h3>
                  {resetMessage && (
                    <p className={styles.modalMessage}>{resetMessage}</p>
                  )}
                  <form onSubmit={handlePasswordReset}>
                    {isForgotPassword ? (
                      <>
                        {!isResetConfirmation ? (
                          <div className={styles.modalFormGroup}>
                            <label htmlFor="email">Email</label>
                            <input
                              type="email"
                              id="email"
                              value={passwordData.email}
                              onChange={(e) => setPasswordData(prev => ({
                                ...prev,
                                email: e.target.value
                              }))}
                              required
                              className={styles.modalInput}
                              placeholder="Enter your email"
                            />
                          </div>
                        ) : (
                          <>
                            <div className={styles.modalFormGroup}>
                              <label htmlFor="resetCode">Reset Code</label>
                              <input
                                type="text"
                                id="resetCode"
                                value={passwordData.resetCode}
                                onChange={(e) => setPasswordData(prev => ({
                                  ...prev,
                                  resetCode: e.target.value
                                }))}
                                required
                                className={styles.modalInput}
                                placeholder="Enter code from email"
                              />
                            </div>
                            <div className={styles.modalFormGroup}>
                              <label htmlFor="newPassword">New Password</label>
                              <input
                                type="password"
                                id="newPassword"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData(prev => ({
                                  ...prev,
                                  newPassword: e.target.value
                                }))}
                                required
                                className={styles.modalInput}
                                placeholder="Enter new password"
                              />
                            </div>
                            <div className={styles.modalFormGroup}>
                              <label htmlFor="confirmPassword">Confirm New Password</label>
                              <input
                                type="password"
                                id="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData(prev => ({
                                  ...prev,
                                  confirmPassword: e.target.value
                                }))}
                                required
                                className={styles.modalInput}
                                placeholder="Confirm new password"
                              />
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <div className={styles.modalFormGroup}>
                          <label htmlFor="currentPassword">Current Password</label>
                          <input
                            type="password"
                            id="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({
                              ...prev,
                              currentPassword: e.target.value
                            }))}
                            required
                            className={styles.modalInput}
                            placeholder="Enter current password"
                          />
                        </div>
                        <div className={styles.modalFormGroup}>
                          <label htmlFor="newPassword">New Password</label>
                          <input
                            type="password"
                            id="newPassword"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({
                              ...prev,
                              newPassword: e.target.value
                            }))}
                            required
                            className={styles.modalInput}
                            placeholder="Enter new password"
                          />
                        </div>
                        <div className={styles.modalFormGroup}>
                          <label htmlFor="confirmPassword">Confirm New Password</label>
                          <input
                            type="password"
                            id="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({
                              ...prev,
                              confirmPassword: e.target.value
                            }))}
                            required
                            className={styles.modalInput}
                            placeholder="Confirm new password"
                          />
                        </div>
                      </>
                    )}
                    {passwordError && (
                      <p className={styles.modalError}>{passwordError}</p>
                    )}
                    <div className={styles.modalActions}>
                      {!isForgotPassword && (
                        <button 
                          type="button" 
                          className={styles.modalButton}
                          onClick={() => {
                            setIsForgotPassword(true);
                            setPasswordError('');
                            setResetMessage('');
                          }}
                        >
                          Forgot Password?
                        </button>
                      )}
                      <button 
                        type="button" 
                        className={styles.modalButton}
                        onClick={() => {
                          setShowPasswordReset(false);
                          resetPasswordModal();
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
                      >
                        {isForgotPassword 
                          ? (isResetConfirmation ? 'Reset Password' : 'Send Reset Code')
                          : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        ) : (
          <button className={styles.loginButton} onClick={onSignInClick}>
            Sign In
          </button>
        )}
      </div>
    </div>
  );
} 