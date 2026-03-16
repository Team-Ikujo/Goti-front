import type { SocialProvider } from "@/features/auth/api/oauthApi";

const SOCIAL_STATE_STORAGE_KEY = "oauth-issued-states";

type StoredSocialStates = Partial<Record<SocialProvider, string>>;

const readStoredSocialStates = (): StoredSocialStates => {
  if (typeof window === "undefined") {
    return {};
  }

  const rawValue = window.sessionStorage.getItem(SOCIAL_STATE_STORAGE_KEY);

  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue) as StoredSocialStates;
  } catch {
    window.sessionStorage.removeItem(SOCIAL_STATE_STORAGE_KEY);
    return {};
  }
};

const writeStoredSocialStates = (states: StoredSocialStates) => {
  if (typeof window === "undefined") {
    return;
  }

  if (Object.keys(states).length === 0) {
    window.sessionStorage.removeItem(SOCIAL_STATE_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(
    SOCIAL_STATE_STORAGE_KEY,
    JSON.stringify(states),
  );
};

export const setIssuedSocialState = (
  provider: SocialProvider,
  state: string,
) => {
  const currentStates = readStoredSocialStates();
  writeStoredSocialStates({
    ...currentStates,
    [provider]: state,
  });
};

export const getIssuedSocialState = (provider: SocialProvider) => {
  const currentStates = readStoredSocialStates();
  return currentStates[provider] ?? null;
};

export const clearIssuedSocialState = (provider: SocialProvider) => {
  const currentStates = readStoredSocialStates();

  if (!(provider in currentStates)) {
    return;
  }

  const nextStates = { ...currentStates };
  delete nextStates[provider];
  writeStoredSocialStates(nextStates);
};
