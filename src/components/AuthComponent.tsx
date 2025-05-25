"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, fetchUserAttributes, deleteUser, signOut } from "aws-amplify/auth";
import TopBar from "./TopBar";
import CustomAuth from "./CustomAuth";
import styles from './AuthComponent.module.css';

type User = { username: string; attributes?: { email?: string; preferred_username?: string } }

interface AuthComponentProps {
    children: (user: User | null) => React.ReactNode;
}

export default function AuthComponent({ children }: AuthComponentProps) {
    const [user, setUser] = useState<User | null>(null);
    const [userAttributes, setUserAttributes] = useState<any>(null);
    const [showAuthenticator, setShowAuthenticator] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        try {
            const currentUser = await getCurrentUser();
            const attributes = await fetchUserAttributes();
            
            setUser(currentUser);
            setUserAttributes(attributes);
        } catch (err) {
            setUser(null);
            setUserAttributes(null);
        }
    }

    function handleSignOut() {
        setUser(null);
        setUserAttributes(null);
        signOut();
    }

    function handleAuthSuccess() {
        setShowAuthenticator(false);
        checkUser();
    }

    async function handleDeleteAccount() {
        setShowDeleteConfirm(true);
        setDeleteConfirmation('');
    }

    async function confirmDeleteAccount() {
        try {
            // Finally delete the user account
            await deleteUser();
            
            // Clear local state
            handleSignOut();
        } catch (error) {
            console.error("Error deleting account:", error);
            // Re-throw to let the UI handle the error
            throw error;
        } finally {
            setShowDeleteConfirm(false);
        }
    }

    return (
        <div className={styles.authWrapper}>
            <TopBar 
                user={user ? {
                    ...user,
                    attributes: userAttributes
                } : undefined}
                onSignOut={handleSignOut}
                onSignInClick={() => setShowAuthenticator(true)}
                onDeleteAccount={handleDeleteAccount}
            />
            {showDeleteConfirm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Delete Account</h3>
                        <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                        <div className={styles.confirmationInput}>
                            <label htmlFor="deleteConfirmation">
                                To confirm, type "delete" below:
                            </label>
                            <input
                                id="deleteConfirmation"
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder="Type 'delete' to confirm"
                                className={styles.modalInput}
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button 
                                className={styles.modalButton}
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteConfirmation('');
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                className={`${styles.modalButton} ${styles.modalButtonDanger}`}
                                onClick={confirmDeleteAccount}
                                disabled={deleteConfirmation.toLowerCase() !== 'delete'}
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className={styles.authContent}>
                {showAuthenticator ? (
                    <CustomAuth
                        onClose={() => setShowAuthenticator(false)}
                        onSuccess={handleAuthSuccess}
                    />
                ) : (
                    <div className={styles.authenticatedContent}>
                        {children(user)}
                    </div>
                )}
            </div>
        </div>
    );
} 