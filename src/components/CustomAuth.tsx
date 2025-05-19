"use client";

import { useState } from 'react';
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth';
import { isUsernameTaken, validateUsername, reserveUsername } from '@/utils/username';
import styles from './CustomAuth.module.css';

interface CustomAuthProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface FormData {
    email: string;
    password: string;
    code?: string;
    username: string;
}

export default function CustomAuth({ onClose, onSuccess }: CustomAuthProps) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [needsConfirmation, setNeedsConfirmation] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        username: '',
        code: ''
    });
    const [error, setError] = useState('');
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        try {
            if (needsConfirmation) {
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
                // Validate username format
                const validation = validateUsername(formData.username);
                if (!validation.isValid) {
                    setError(validation.error || 'Invalid username');
                    return;
                }

                // Check if username is taken
                setIsCheckingUsername(true);
                try {
                    const taken = await isUsernameTaken(formData.username);
                    if (taken) {
                        setError('Username is already taken');
                        setIsCheckingUsername(false);
                        return;
                    }
                } catch (error) {
                    console.error('Error checking username:', error);
                    setError('Failed to check username availability');
                    setIsCheckingUsername(false);
                    return;
                }

                // Proceed with sign up
                const signUpResult = await signUp({
                    username: formData.email,
                    password: formData.password,
                    options: {
                        userAttributes: {
                            email: formData.email,
                            preferred_username: formData.username
                        }
                    }
                });

                // Reserve the username
                try {
                    if (!signUpResult.userId) {
                        throw new Error('Username is required');
                    }
                    await reserveUsername(formData.username, signUpResult.userId);
                } catch (error) {
                    console.error('Error reserving username:', error);
                    // We should handle this error, but since the user is already signed up,
                    // we'll let them proceed and try to fix the username later
                }

                setIsCheckingUsername(false);
                setNeedsConfirmation(true);
            } else {
                await signIn({
                    username: formData.email,
                    password: formData.password
                });
                onSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
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
                    <h2>{needsConfirmation ? 'Confirm Sign Up' : (isSignUp ? 'Create Account' : 'Sign In')}</h2>
                    {error && <p className={styles.error}>{error}</p>}
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {needsConfirmation ? (
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
                        </>
                    )}

                    <button 
                        type="submit" 
                        className={styles.submitButton}
                        disabled={isCheckingUsername}
                    >
                        {isCheckingUsername ? 'Checking username...' : 
                         (needsConfirmation ? 'Confirm' : 
                          (isSignUp ? 'Sign Up' : 'Sign In'))}
                    </button>
                </form>

                {!needsConfirmation && (
                    <div className={styles.footer}>
                        <p>
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                            <button
                                className={styles.switchButton}
                                onClick={() => setIsSignUp(!isSignUp)}
                            >
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
} 