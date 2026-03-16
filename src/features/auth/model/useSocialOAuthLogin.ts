import { useCallback } from "react";
import { issueSocialState } from "@/features/auth/api/oauthApi";
import type { SocialProvider } from "@/features/auth/api/oauthApi";
import { setIssuedSocialState } from "@/features/auth/lib/socialStateStorage";
import { openOAuthPopup } from "@/shared/lib/openOAuthPopup";

type UseSocialOAuthLoginParams = {
  provider: SocialProvider;
  buildAuthUrl: (state: string) => string;
};

export const useSocialOAuthLogin = ({
  provider,
  buildAuthUrl,
}: UseSocialOAuthLoginParams) => {
  return useCallback(async () => {
    try {
      const { state } = await issueSocialState(provider);
      const authUrl = buildAuthUrl(state);

      console.log("[OAuth] Requesting provider authorization code.", {
        provider,
        state,
        authUrl,
      });

      setIssuedSocialState(provider, state);
      openOAuthPopup(authUrl);
    } catch (error) {
      console.error(error);
    }
  }, [buildAuthUrl, provider]);
};
