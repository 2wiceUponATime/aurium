import { defineFunction } from "@aws-amplify/backend";

export const cleanupUserData = defineFunction({
    name: "cleanupUserData",
    entry: "./handler.ts",
    runtime: 20,
    environment: {
        // Add any environment variables here if needed
    },
    schedule: "every day",
});