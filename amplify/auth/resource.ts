import { defineAuth } from "@aws-amplify/backend";
import { preSignUp } from "@amplify/functions/preSignUp/resource";
import { cleanupUserData } from "@amplify/functions/cleanupUserData/resource";

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: "CODE",
      verificationEmailSubject: "Confirm your Aurium account",
      verificationEmailBody: (createCode) =>
        `Use this code to verify your email: ${createCode()}`,
      userInvitation: {
        emailSubject: "Welcome to Aurium!",
        emailBody: (user, code) =>
          `We're happy to have you! You can now login with username ${user()} and temporary password ${code()}.`,
      },
    },
  },
  triggers: {
    preSignUp,
  },
  userAttributes: {
    preferredUsername: {
      required: true,
      mutable: false,
    },
  },
  access: (allow) => [
    allow.resource(preSignUp).to(["manageUsers"]),
    allow.resource(cleanupUserData).to(["getUser"]),
  ],
});
