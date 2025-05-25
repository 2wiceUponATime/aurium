import { generateClient } from "aws-amplify/api";
import { type DataClientEnv, getAmplifyDataClientConfig } from '@aws-amplify/backend-function/runtime';
import { Schema } from "@amplify/data/resource";
import { Amplify } from "aws-amplify";
import { env } from '$amplify/env/preSignUp';
import { AdminGetUserCommand, CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

type Model<T extends keyof Schema> = Schema[T]['type'];
type UsernameValidationResult = { isValid: true } | { isValid: false; error: string };

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as unknown as DataClientEnv);
console.log(resourceConfig);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

async function getDataByUsername(username: string, userPoolId: string): Promise<Model<'UserData'> | null> {
    const result = await client.models.UserData.list({
        filter: {
            username: { eq: username }
        }
    });
    if (result.errors) {
        throw new Error(`Failed to get user data of ${username}: ${result.errors.join('\n')}`);
    }
    if (!result.data || !result.data[0]) {
        return null;
    }
    const userData = result.data[0];
    if (!(await userExists(userData.userId, userPoolId))) {
        await client.models.UserData.delete({ userId: userData.userId });
        return null;
    }
    return userData;
}

export async function userExists(userId: string, userPoolId: string): Promise<boolean> {
    try {
        const cognitoClient = new CognitoIdentityProviderClient();
        await cognitoClient.send(new AdminGetUserCommand({
            UserPoolId: userPoolId,
            Username: userId
        }));
        return true;
    } catch (error) {
        if (error instanceof Error && error.name === 'UserNotFoundException') {
            await client.models.UserData.delete({ userId });
            return false;
        }
        throw error;
    }
}

// Normalize username to lowercase for consistent storage and comparison
function normalizeUsername(username: string): string {
    return username.toLowerCase();
}

export async function isUsernameTaken(username: string, userPoolId: string): Promise<boolean> {
    try {
        const normalizedUsername = normalizeUsername(username);
        const result = await getDataByUsername(normalizedUsername, userPoolId);
        return !!result;
    } catch (error) {
        console.group('Error checking username:');
        console.error(error);
        console.groupEnd();
        throw new Error('Failed to check username availability');
    }
}

export async function reserveUsername(username: string, userId: string): Promise<void> {
    try {
        const normalizedUsername = normalizeUsername(username);
        try {
            await client.models.UserData.create({
                userId,
                username: normalizedUsername,
                aurium: 0
            });
        } catch (error) {
            if (error instanceof Error && error.name === 'ConflictException') {
                await client.models.UserData.update({
                    userId,
                    username: normalizedUsername
                });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error reserving username:', error);
        throw new Error('Failed to reserve username');
    }
}

export async function releaseUsername(username: string, userPoolId: string): Promise<void> {
    try {
        const normalizedUsername = normalizeUsername(username);
        const userData = await getDataByUsername(normalizedUsername, userPoolId);
        if (!userData) return;
        await client.models.UserData.delete({
            userId: userData.userId
        });
    } catch (error) {
        console.error('Error releasing username:', error);
        throw new Error('Failed to release username');
    }
}

export function validateUsername(username: string): UsernameValidationResult {
    // Username must be 3-20 characters long
    if (username.length < 3 || username.length > 20) {
        return {
            isValid: false,
            error: 'Username must be between 3 and 20 characters'
        };
    }

    // Only allow letters, numbers, and underscores (case-insensitive)
    if (!/^[a-z0-9_]+$/i.test(username)) {
        return {
            isValid: false,
            error: 'Username can only contain letters, numbers, and underscores'
        };
    }

    // Must start with a letter (case-insensitive)
    if (!/^[a-zA-Z]/i.test(username)) {
        return {
            isValid: false,
            error: 'Username must start with a letter'
        };
    }

    return { isValid: true };
}