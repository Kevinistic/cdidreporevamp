import { createHmac } from "node:crypto";

const TOKEN_LENGTH = 11;

function getSecret(): string {
  const secret = process.env.CAR_TOKEN_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("CAR_TOKEN_SECRET must be set to build car URLs.");
  }
  return "dev-only-car-token-secret";
}

// One-way, deterministic: the same _id always maps to the same URL segment for a given secret.
export function carToken(id: string): string {
  return createHmac("sha256", getSecret()).update(id).digest("base64url").slice(0, TOKEN_LENGTH);
}
