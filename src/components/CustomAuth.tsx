"use client";

import { useState, useEffect } from 'react';
import { signIn, signUp, confirmSignUp, getCurrentUser, fetchUserAttributes, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import styles from './CustomAuth.module.css';

const preSignUpPrefix = 'PreSignUp failed with error ';

interface CustomAuthProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface FormData {
    email: string;
    password: string;
    code?: string;
    username: string;
    newPassword?: string;
}

export default function CustomAuth({ onClose, onSuccess }: CustomAuthProps) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [needsConfirmation, setNeedsConfirmation] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isResetConfirmation, setIsResetConfirmation] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        username: '',
        code: '',
        newPassword: ''
    });
    const [error, setError] = useState('');
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    // Check if user needs confirmation on mount
    useEffect(() => {
        checkUserConfirmationStatus();
    }, []);

    async function checkUserConfirmationStatus() {
        try {
            const currentUser = await getCurrentUser();
            const attributes = await fetchUserAttributes();
            // If we have a current user but they're not confirmed, show confirmation UI
            if (currentUser && !attributes.email_verified) {
                setNeedsConfirmation(true);
                setFormData(prev => ({
                    ...prev,
                    email: currentUser.username
                }));
            }
        } catch (err) {
            // Ignore errors here as they likely mean no user is signed in
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        try {
            if (isForgotPassword) {
                if (!isResetConfirmation) {
                    // Request password reset
                    await resetPassword({
                        username: formData.email
                    });
                    setIsResetConfirmation(true);
                    setError('Check your email for a reset code');
                } else {
                    // Confirm password reset
                    await confirmResetPassword({
                        username: formData.email,
                        confirmationCode: formData.code || '',
                        newPassword: formData.newPassword || ''
                    });
                    // After successful reset, try to sign in
                    await signIn({
                        username: formData.email,
                        password: formData.newPassword || ''
                    });
                    onSuccess();
                }
            } else if (needsConfirmation) {
                await confirmSignUp({
                    username: formData.email,
                    confirmationCode: formData.code || ''
                });
                // After confirmation, try to sign in
                await signIn({
                    username: formData.email,
                    password: formData.password
                });
                onSuccess();
            } else if (isSignUp) {
                setIsCheckingUsername(true);

                // Proceed with sign up
                await signUp({
                    username: formData.email,
                    password: formData.password,
                    options: {
                        userAttributes: {
                            email: formData.email,
                            preferred_username: formData.username
                        }
                    }
                });

                setIsCheckingUsername(false);
                setNeedsConfirmation(true);
            } else {
                try {
                    await signIn({
                        username: formData.email,
                        password: formData.password
                    });
                    onSuccess();
                } catch (err: any) {
                    // Check if this is an unconfirmed user error
                    if (err.name === 'UserNotConfirmedException') {
                        setNeedsConfirmation(true);
                        setError('Please check your email for a confirmation code');
                    } else {
                        throw err; // Re-throw other errors
                    }
                }
            }
        } catch (err: any) {
            let message = err.message || 'An error occurred';
            if (message.startsWith(preSignUpPrefix)) {
                message = message.slice(preSignUpPrefix.length, -1);
            }
            setError(message);
            setIsCheckingUsername(false);
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                <button className={styles.closeButton} onClick={onClose}>
                    ×
                </button>
                
                <div className={styles.header}>
                    <h2>
                        {isForgotPassword 
                            ? (isResetConfirmation ? 'Reset Password' : 'Forgot Password')
                            : (needsConfirmation 
                                ? 'Confirm Sign Up' 
                                : (isSignUp ? 'Create Account' : 'Sign In'))}
                    </h2>
                    {error && <p className={styles.error}>{error}</p>}
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {isForgotPassword ? (
                        <>
                            <div className={styles.formGroup}>
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>

                            {isResetConfirmation && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="code">Reset Code</label>
                                        <input
                                            type="text"
                                            id="code"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleChange}
                                            placeholder="Enter code from email"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="newPassword">New Password</label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            placeholder="Enter new password"
                                            required
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    ) : needsConfirmation ? (
                        <div className={styles.formGroup}>
                            <label htmlFor="code">Confirmation Code</label>
                            <input
                                type="text"
                                id="code"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                placeholder="Enter code from email"
                                required
                            />
                        </div>
                    ) : (
                        <>
                            <div className={styles.formGroup}>
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>

                            {isSignUp && (
                                <div className={styles.formGroup}>
                                    <label htmlFor="username">Username</label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Choose a username"
                                        required
                                    />
                                    <small className={styles.hint}>
                                        Username must be 3-20 characters, start with a letter, and contain only letters, numbers, and underscores
                                    </small>
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>

                            {!isSignUp && !needsConfirmation && (
                                <div className={styles.forgotPassword}>
                                    <button
                                        type="button"
                                        className={styles.forgotPasswordButton}
                                        onClick={() => {
                                            setIsForgotPassword(true);
                                            setError('');
                                        }}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    <button 
                        type="submit" 
                        className={styles.submitButton}
                        disabled={isCheckingUsername}
                    >
                        {isCheckingUsername ? 'Checking username...' : 
                         (isForgotPassword 
                            ? (isResetConfirmation ? 'Reset Password' : 'Send Reset Code')
                            : (needsConfirmation ? 'Confirm' : 
                               (isSignUp ? 'Sign Up' : 'Sign In')))}
                    </button>
                </form>

                {!needsConfirmation && !isForgotPassword && (
                    <div className={styles.footer}>
                        <p>
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                            <button
                                className={styles.switchButton}
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError('');
                                }}
                            >
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </button>
                        </p>
                    </div>
                )}

                {isForgotPassword && (
                    <div className={styles.footer}>
                        <p>
                            Remember your password?
                            <button
                                className={styles.switchButton}
                                onClick={() => {
                                    setIsForgotPassword(false);
                                    setIsResetConfirmation(false);
                                    setError('');
                                }}
                            >
                                Sign In
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
} 