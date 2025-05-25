import { defineFunction } from "@aws-amplify/backend";

export const preSignUp = defineFunction({
    name: "preSignUp",
    entry: "./handler.ts",
    runtime: 20,
    environment: {
        // Add any environment variables here if needed
    }
});