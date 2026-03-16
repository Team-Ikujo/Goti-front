import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useSocialLogin,
  useSubmitAuthCode,
} from "@/features/auth/model/useSubmitAuthCode";
import type {
  SocialProvider,
  SubmitAuthCodeParams,
} from "@/features/auth/api/oauthApi";
import { useAuthStore } from "@/entities/auth/model/authStore";
import { ApiError } from "@/shared/api/client";
import {
  OAUTH_SUCCESS_MESSAGE_TYPE,
  type OAuthSuccessMessage,
} from "@/shared/lib/oauthMessage";

const isSocialProvider = (value?: string): value is SocialProvider => {
  switch (value) {
    case "kakao":
    case "naver":
    case "google":
      return true;
    default:
      return false;
  }
};

const requiresState = (provider: SocialProvider) => {
  switch (provider) {
    case "google":
    case "naver":
      return true;
    case "kakao":
      return false;
    default:
      return false;
  }
};

const formatErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    const details =
      typeof error.data === "string"
        ? error.data
        : JSON.stringify(error.data, null, 2);

    return `[${error.status ?? "NO_STATUS"}] ${error.message}${
      details ? `\n${details}` : ""
    }`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

type UseOAuthCallbackFlowParams = {
  provider?: string;
};

export const useOAuthCallbackFlow = ({ provider }: UseOAuthCallbackFlowParams) => {
  const [message, setMessage] = useState("로그인 중...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizedProvider = useMemo(() => provider?.toLowerCase(), [provider]);
  const submitAuthCodeMutation = useSubmitAuthCode();
  const socialLoginMutation = useSocialLogin();
  const setAuthTokens = useAuthStore((state) => state.setAuthTokens);
  const setRecentLoginProvider = useAuthStore(
    (state) => state.setRecentLoginProvider,
  );
  const didRunRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (didRunRef.current) {
      return;
    }
    didRunRef.current = true;

    const redirectFromPopup = (
      path: string,
      tokens: { accessToken: string | null; socialVerifyToken: string | null },
      provider: SocialProvider,
    ) => {
      if (window.opener && !window.opener.closed) {
        const message: OAuthSuccessMessage = {
          type: OAUTH_SUCCESS_MESSAGE_TYPE,
          accessToken: tokens.accessToken,
          socialVerifyToken: tokens.socialVerifyToken,
          provider,
          redirectPath: path,
        };
        window.opener.postMessage(
          message,
          window.location.origin,
        );
        window.close();
        return true;
      }
      return false;
    };

    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");

        if (!code) {
          throw new Error("Missing authorization code.");
        }

        if (!isSocialProvider(normalizedProvider)) {
          throw new Error(`Unsupported provider: ${normalizedProvider ?? "none"}`);
        }

        if (requiresState(normalizedProvider) && !state) {
          throw new Error("Missing OAuth state.");
        }

        const verifyPayload: SubmitAuthCodeParams = {
          provider: normalizedProvider,
          authCode: code,
          state,
        };

        const response = await submitAuthCodeMutation.mutateAsync(verifyPayload);

        setRecentLoginProvider(normalizedProvider);

        if (response.isRegistered) {
          const loginResponse = await socialLoginMutation.mutateAsync({
            socialVerifyToken: response.socialVerifyToken,
          });
          const tokens = {
            accessToken: loginResponse.accessToken,
            socialVerifyToken: null,
          };
          setAuthTokens(tokens);
          setMessage("로그인 완료!");
          if (!redirectFromPopup("/", tokens, normalizedProvider)) {
            navigate("/", { replace: true });
          }
          return;
        }

        const tokens = {
          accessToken: null,
          socialVerifyToken: response.socialVerifyToken,
        };
        setAuthTokens(tokens);
        setMessage("추가 회원정보를 입력해 주세요.");
        if (!redirectFromPopup("/auth/terms", tokens, normalizedProvider)) {
          navigate("/auth/terms", { replace: true });
        }
      } catch (error) {
        setMessage("로그인에 실패했어요. 다시 시도해 주세요.");
        setErrorMessage(formatErrorMessage(error));
        console.error(error);
      }
    };

    void run();
  }, [
    navigate,
    normalizedProvider,
    setAuthTokens,
    setRecentLoginProvider,
    socialLoginMutation,
    submitAuthCodeMutation,
  ]);

  return {
    message,
    errorMessage,
    normalizedProvider,
  };
};
