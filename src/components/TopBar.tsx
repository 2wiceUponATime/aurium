"use client";

import { useState } from "react";
import { signOut } from "aws-amplify/auth";
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

  async function handleSignOut() {
    try {
      await signOut();
      if (onSignOut) onSignOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
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