import * as dotenv from "dotenv";
dotenv.config();

export const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || "";
export const RESEND_FROM_EMAIL = "onboarding@resend.dev";
