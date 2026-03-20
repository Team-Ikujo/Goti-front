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

        console.log("[OAuth] Requesting provider authorization code.", {
          provider,
          authUrl,
        });

        openOAuthPopup(authUrl);
        startLoginPopupTimer();
        return;
      }

      const { state } = await issueSocialState(provider);
      const authUrl = buildAuthUrl(state);

      console.log("[OAuth] Requesting provider authorization code.", {
        provider,
        state,
        authUrl,
      });

      setIssuedSocialState(provider, state);
      openOAuthPopup(authUrl);
      startLoginPopupTimer();
    } catch (error) {
      console.error(error);
    }
  }, [buildAuthUrl, provider, requiresIssuedState, startLoginPopupTimer]);
};
