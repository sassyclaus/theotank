import { createClerkClient, type ClerkClient } from "@clerk/backend";
import { config } from "../config";

let _client: ClerkClient | null = null;

export function getClerkClient(): ClerkClient {
  if (!_client) {
    if (!config.clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY is not configured");
    }
    _client = createClerkClient({ secretKey: config.clerkSecretKey });
  }
  return _client;
}
