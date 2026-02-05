import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI, GOOGLE_SCOPES } from "@/shared/config/oauth";

export const buildGoogleAuthUrl = (state: string): string => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    throw new Error("Google OAuth env is not configured.");
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    state,
    include_granted_scopes: "true",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};
