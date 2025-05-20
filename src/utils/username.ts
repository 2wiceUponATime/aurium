import { generateClient } from "aws-amplify/data";
import type { Schema } from "@amplify/data/resource";

const client = generateClient<Schema>();

export async function isUsernameTaken(username: string): Promise<boolean> {
    try {
        const result = await client.models.Username.get(
            { username },
            { authMode: 'apiKey' }  // Explicitly use API key authorization
        );
        return !!result.data;
    } catch (error) {
        console.group('Error checking username:');
        console.error(error);
        console.groupEnd();
        throw new Error('Failed to check username availability');
    }
}

export async function reserveUsername(username: string, userId: string): Promise<void> {
    try {
        await client.models.Username.create({
            username,
            userId
        });
    } catch (error) {
        console.error('Error reserving username:', error);
        throw new Error('Failed to reserve username');
    }
}

export async function releaseUsername(username: string): Promise<void> {
    try {
        await client.models.Username.delete({ username });
    } catch (error) {
        console.error('Error releasing username:', error);
        throw new Error('Failed to release username');
    }
}

export function validateUsername(username: string): { isValid: boolean; error?: string } {
    // Username must be 3-20 characters long
    if (username.length < 3 || username.length > 20) {
        return {
            isValid: false,
            error: 'Username must be between 3 and 20 characters'
        };
    }

    // Only allow letters, numbers, and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return {
            isValid: false,
            error: 'Username can only contain letters, numbers, and underscores'
        };
    }

    // Must start with a letter
    if (!/^[a-zA-Z]/.test(username)) {
        return {
            isValid: false,
            error: 'Username must start with a letter'
        };
    }

    return { isValid: true };
} 