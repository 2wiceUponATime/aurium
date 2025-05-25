import { defineFunction } from "@aws-amplify/backend";

export const cleanupUserData = defineFunction({
    name: "cleanupUserData",
    entry: "./handler.ts",
    runtime: 20,
    schedule: "every day"
});