import { Inngest } from "inngest";

// Configuration for Inngest
export const inngestConfig = {
  // Base URL for Inngest events (dev vs prod)
  baseUrl:
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_APP_URL
      : "http://localhost:3000",

  // Event signing key (for production)
  signingKey: process.env.INNGEST_SIGNING_KEY,

  // Event key
  eventKey: process.env.INNGEST_EVENT_KEY,
};

export default inngestConfig;
