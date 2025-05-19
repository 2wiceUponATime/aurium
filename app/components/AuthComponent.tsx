"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import UsernameSetup from "./UsernameSetup";
import TopBar from "./TopBar";
import CustomAuth from "./CustomAuth";
import styles from './AuthComponent.module.css';

interface AuthComponentProps {
    children: React.ReactNode;
}

export default function AuthComponent({ children }: AuthComponentProps) {
    const [user, setUser] = useState<any>(null);
    const [needsUsername, setNeedsUsername] = useState(false);
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
            
            // Check if user needs to set up a username
            if (!attributes.preferred_username) {
                setNeedsUsername(true);
            }
        } catch (err) {
            setUser(null);
            setUserAttributes(null);
            setNeedsUsername(false);
        }
    }

    function handleUsernameSetupComplete() {
        setNeedsUsername(false);
        checkUser(); // Refresh user data
    }

    function handleSignOut() {
        setUser(null);
        setUserAttributes(null);
        setNeedsUsername(false);
    }

    function handleAuthSuccess() {
        setShowAuthenticator(false);
        checkUser();
    }

    if (needsUsername) {
        return <UsernameSetup onComplete={handleUsernameSetupComplete} />;
    }

    // Combine user data with attributes for the TopBar
    const userData = user ? {
        ...user,
        attributes: userAttributes
    } : undefined;

    return (
        <div className={styles.authWrapper}>
            <TopBar 
                user={userData}
                onSignOut={handleSignOut}
                onSignInClick={() => setShowAuthenticator(true)}
            />
            <div className={styles.authContent}>
                {showAuthenticator ? (
                    <CustomAuth
                        onClose={() => setShowAuthenticator(false)}
                        onSuccess={handleAuthSuccess}
                    />
                ) : (
                    <div className={styles.authenticatedContent}>
                        {user ? children : (
                            <div className={styles.loginPrompt}>
                                <h2>Welcome to Aurium</h2>
                                <p>Please sign in to continue</p>
                                <button 
                                    className={styles.loginButton}
                                    onClick={() => setShowAuthenticator(true)}
                                >
                                    Sign In
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
} 