const required = ["MONGODB_URI", "JWT_SECRET"] as const;

export function checkEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}. Copy .env.example to .env and fill them in.`);
  }
}
