import { defineAuth } from "@aws-amplify/backend";
import { preSignUp } from "@amplify/functions/preSignUp/resource";

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
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
  access: (allow) => [allow.resource(preSignUp).to(["manageUsers"])],
});
