"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, fetchUserAttributes, deleteUser, signOut } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@amplify/data/resource";
import { releaseUsername } from "@/utils/username";
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

    async function handleDeleteAccount() {
        const username = userAttributes?.preferred_username;
        const client = generateClient<Schema>();
        
        try {
            // First try to release the username while we still have a valid token
            if (username) {
                try {
                    await client.models.Username.delete({ username });
                } catch (error) {
                    console.warn("Failed to release username:", error);
                    // Non-critical error, we can continue
                }
            }

            // Then sign out to clear any existing tokens
            await signOut();
            
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