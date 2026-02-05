export const createOAuthState = () => {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
};
