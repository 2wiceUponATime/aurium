import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
      done: a.boolean(),
      priority: a.integer()
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'update', 'create', 'delete']),
    ]),
  Username: a
    .model({
      username: a.string().required(),
      userId: a.string()
    })
    .identifier(['username'])
    .authorization((allow) => [
      allow.publicApiKey().to(['read']),
      allow.authenticated().to(['create', 'delete'])
    ])
});

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
