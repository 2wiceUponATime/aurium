import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { cleanupUserData } from './functions/cleanupUserData/resource';

defineBackend({
  auth,
  data,
  cleanupUserData
});