import { useCallback } from "react";
import { issueSocialState } from "@/features/auth/api/oauthApi";
import type { SocialProvider } from "@/features/auth/api/oauthApi";
import { setIssuedSocialState } from "@/features/auth/lib/socialStateStorage";
import { openOAuthPopup } from "@/shared/lib/openOAuthPopup";
import { useAuthStore } from "@/entities/auth/model/authStore";

type UseSocialOAuthLoginParams = {
  provider: SocialProvider;
  requiresIssuedState: boolean;
  buildAuthUrl: (state?: string) => string;
};

export const useSocialOAuthLogin = ({
  provider,
  requiresIssuedState,
  buildAuthUrl,
}: UseSocialOAuthLoginParams) => {
  const startLoginPopupTimer = useAuthStore((s) => s.startLoginPopupTimer);

  return useCallback(async () => {
    try {
      if (!requiresIssuedState) {
        const authUrl = buildAuthUrl();
        openOAuthPopup(authUrl);
        startLoginPopupTimer();
        return;
      }

      const { state } = await issueSocialState(provider);
      const authUrl = buildAuthUrl(state);

      setIssuedSocialState(provider, state);
      openOAuthPopup(authUrl);
      startLoginPopupTimer();
    } catch {
    }
  }, [buildAuthUrl, provider, requiresIssuedState, startLoginPopupTimer]);
};
