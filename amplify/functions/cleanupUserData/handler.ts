import { generateClient } from "aws-amplify/api";
import { Schema } from "@amplify/data/resource";
import { userExists } from "@/utils/username";
import type { EventBridgeHandler } from 'aws-lambda';
import { env } from "$amplify/env/cleanupUserData";

const client = generateClient<Schema>();

/**
 * Lambda handler to clean up orphaned UserData records
 * Runs daily to remove UserData records for non-existent users
 */
export const handler: EventBridgeHandler<'Scheduled Event', null, void> = async (_event, _context) => {
    try {
        // Get the user pool ID from the environment variable set by the backend
        const userPoolId = env.AMPLIFY_AUTH_USERPOOL_ID;
        if (!userPoolId) {
            throw new Error('AUTH_USERPOOLID environment variable is not set. This should be set by the backend configuration.');
        }

        console.log('Starting cleanup with user pool ID:', userPoolId);

        // Get all UserData records
        const result = await client.models.UserData.list();
        if (result.errors) {
            throw new Error(`Failed to list UserData: ${result.errors.map(error => JSON.stringify(error, null, 2)).join('\n')}`);
        }

        if (!result.data) {
            console.log('No UserData records found');
            return;
        }

        console.log(`Found ${result.data.length} UserData records to check`);

        let cleanedCount = 0;
        const cleanupPromises = result.data.map(async (userData) => {
            const exists = await userExists(userData.userId, userPoolId);
            if (!exists) {
                try {
                    await client.models.UserData.delete({ userId: userData.userId });
                    cleanedCount++;
                    console.log(`Deleted UserData for non-existent user ${userData.userId}`);
                } catch (error) {
                    console.error(`Failed to delete UserData for user ${userData.userId}:`, error);
                }
            }
        });

        await Promise.all(cleanupPromises);
        console.log(`Cleanup complete. Removed ${cleanedCount} orphaned UserData records.`);
    } catch (error) {
        console.error('Error during UserData cleanup:', error);
        throw error;
    }
}; 