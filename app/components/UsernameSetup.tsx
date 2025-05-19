"use client";

import { useState } from "react";
import { updateUserAttributes } from "aws-amplify/auth";

interface UsernameSetupProps {
    onComplete: () => void;
}

export default function UsernameSetup({ onComplete }: UsernameSetupProps) {
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            if (username.length < 3) {
                throw new Error("Username must be at least 3 characters long");
            }
            
            await updateUserAttributes({
                userAttributes: {
                    preferred_username: username
                }
            });
            
            onComplete();
        } catch (err: any) {
            setError(err.message || "Failed to update username");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="username-setup">
            <h2>Set Your Username</h2>
            <p>Please choose a username to continue</p>
            
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    disabled={isLoading}
                    minLength={3}
                    required
                />
                
                {error && <div className="error">{error}</div>}
                
                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Setting username..." : "Set Username"}
                </button>
            </form>

            <style jsx>{`
                .username-setup {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    max-width: 400px;
                    margin: 2rem auto;
                }

                h2 {
                    margin: 0 0 1rem;
                    color: #333;
                }

                p {
                    color: #666;
                    margin-bottom: 1.5rem;
                }

                form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                input {
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                }

                input:focus {
                    border-color: var(--amplify-colors-brand-primary-80);
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
                }

                button {
                    background: var(--amplify-colors-brand-primary-80);
                    color: white;
                    border: none;
                    padding: 0.75rem;
                    border-radius: 4px;
                    font-size: 1rem;
                    cursor: pointer;
                }

                button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                button:hover:not(:disabled) {
                    background: var(--amplify-colors-brand-primary-90);
                }

                .error {
                    color: #ff4742;
                    font-size: 0.9rem;
                    margin-top: -0.5rem;
                }
            `}</style>
        </div>
    );
} 