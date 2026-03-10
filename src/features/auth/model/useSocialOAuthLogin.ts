import { useCallback } from "react";
import { issueSocialState } from "@/features/auth/api/oauthApi";
import type { SocialProvider } from "@/features/auth/api/oauthApi";
import { openOAuthPopup } from "@/shared/lib/openOAuthPopup";

type UseSocialOAuthLoginParams = {
  provider: SocialProvider;
  requiresIssuedState: boolean;
  buildAuthUrl: (state?: string) => string;
  createState?: () => string;
};

export const useSocialOAuthLogin = ({
  provider,
  requiresIssuedState,
  buildAuthUrl,
  createState,
}: UseSocialOAuthLoginParams) => {
  return useCallback(async () => {
    try {
      if (createState) {
        openOAuthPopup(buildAuthUrl(createState()));
        return;
      }

      if (requiresIssuedState) {
        const { state } = await issueSocialState(provider);
        openOAuthPopup(buildAuthUrl(state));
        return;
      }

      openOAuthPopup(buildAuthUrl());
    } catch (error) {
      console.error(error);
    }
  }, [buildAuthUrl, createState, provider, requiresIssuedState]);
};
