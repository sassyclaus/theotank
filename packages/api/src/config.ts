export const config = {
  waitlistTokenSecret:
    process.env.WAITLIST_TOKEN_SECRET || "waitlist-dev-secret",
  siteUrl: process.env.SITE_URL || "http://localhost:4321",
  apiUrl: process.env.API_URL || "http://localhost:3001",
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM ?? "TheoTank <notifications@theotank.com>",
  },
};

export function validateConfig() {
  if (process.env.RAILWAY_ENVIRONMENT && !process.env.WAITLIST_TOKEN_SECRET) {
    throw new Error("WAITLIST_TOKEN_SECRET is required in production");
  }
}
