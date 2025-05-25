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
        
        try {
            // Finally delete the user account
            await deleteUser();
            
            // Clear local state
            handleSignOut();
        } catch (error) {
            console.error("Error deleting account:", error);
            // Re-throw to let the UI handle the error
            throw error;
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
                onDeleteAccount={process.env.NODE_ENV === 'development' ? handleDeleteAccount : undefined}
            />
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