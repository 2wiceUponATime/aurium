import { generateClient } from "aws-amplify/api";
import { Schema } from "@amplify/data/resource";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { userExists } from "@/utils/username";
import outputs from '@amplify/outputs';

const client = generateClient<Schema>();
const cognitoClient = new CognitoIdentityProviderClient();
const userPoolId = outputs.auth.user_pool_id;

/**
 * Lambda handler to clean up orphaned UserData records
 */
export const handler = async (_event: any, _context: any) => {
    try {
        // Get all UserData records
        const result = await client.models.UserData.list();
        if (result.errors) {
            throw new Error(`Failed to list UserData: ${result.errors.join('\n')}`);
        }

        if (!result.data) {
            console.log('No UserData records found');
            return;
        }

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