import { preSignUp } from "@amplify/functions/preSignUp/resource";
import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { cleanupUserData } from "@amplify/functions/cleanupUserData/resource";

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
      done: a.boolean(),
      priority: a.integer(),
      owner: a.string()
    })
    .authorization((allow) => [
      allow.owner().to(['read', 'create', 'update', 'delete'])
    ]),
  UserData: a
    .model({
      userId: a.string().required(),
      username: a.string().required(),
      aurium: a.float().required().default(0)
    })
    .identifier(['userId'])
    .authorization((allow) => [
      allow.publicApiKey().to(['read'])
    ])
}).authorization((allow) => [
  allow.resource(preSignUp).to(['query', 'mutate']),
  allow.resource(cleanupUserData).to(['query', 'mutate'])
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    // Keep API key for development/testing
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
