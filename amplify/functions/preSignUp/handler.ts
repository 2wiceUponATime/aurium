import { isUsernameTaken, reserveUsername, validateUsername } from '@/utils/username';
import type { PreSignUpTriggerHandler } from 'aws-lambda';

export const handler: PreSignUpTriggerHandler = async (event, _context) => {
    const { request, userPoolId } = event;
    
    const username = request.userAttributes.preferred_username;
    if (!username) {
        throw new Error('Username is required');
    }
    const result = validateUsername(username);
    if (!result.isValid) {
        throw new Error(result.error);
    }
    if (await isUsernameTaken(username, userPoolId)) {
        throw new Error('Username is already taken');
    }
    await reserveUsername(username, event.userName);
    
    return event;
};