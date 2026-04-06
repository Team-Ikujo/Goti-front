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
import { useAuthStore, type LoginAlert } from "@/entities/auth/model/authStore";
import type { LoginAccountStatus } from "@/features/auth/api/authApi";
import { ApiError } from "@/shared/api/client";
import {
  OAUTH_SUCCESS_MESSAGE_TYPE,
  type OAuthSuccessMessage,
} from "@/shared/lib/oauthMessage";
import { isMswEnabled } from "@/shared/config/runtime";
import {
  clearIssuedSocialState,
  getIssuedSocialState,
} from "@/features/auth/lib/socialStateStorage";

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

const waitForMswControl = async () => {
  if (
    !isMswEnabled ||
    typeof window === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  if (navigator.serviceWorker.controller) {
    return;
  }

  await new Promise<void>((resolve) => {
    const timeoutId = window.setTimeout(resolve, 2000);

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => {
        window.clearTimeout(timeoutId);
        resolve();
      },
      { once: true },
    );
  });
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
  const clearLoginPopupTimer = useAuthStore(
    (state) => state.clearLoginPopupTimer,
  );
  const setLoginAlert = useAuthStore((state) => state.setLoginAlert);
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

    // accountStatus → LoginAlert 변환
    const buildLoginAlert = (
      status: LoginAccountStatus | undefined,
      failCount: number | undefined,
      redirectPath: string,
    ): LoginAlert | undefined => {
      switch (status) {
        case 'failed_under_5':
          return { type: 'failed_under_5', failCount: failCount ?? 0, redirectPath };
        case 'failed_over_5':
          return { type: 'failed_over_5', failCount: failCount ?? 5 };
        case 'dormant':
          return { type: 'dormant', redirectPath };
        case 'rejoining_locked':
          return { type: 'rejoining_locked' };
        default:
          return undefined;
      }
    };

    const redirectFromPopup = (
      path: string,
      tokens: { accessToken: string | null; socialVerifyToken: string | null },
      provider: SocialProvider,
      loginAlert?: LoginAlert,
    ) => {
      if (window.opener && !window.opener.closed) {
        const message: OAuthSuccessMessage = {
          type: OAUTH_SUCCESS_MESSAGE_TYPE,
          accessToken: tokens.accessToken,
          socialVerifyToken: tokens.socialVerifyToken,
          provider,
          redirectPath: path,
          loginAlert,
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
        await waitForMswControl();

        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!code) {
          throw new Error("Missing authorization code.");
        }

        if (!isSocialProvider(normalizedProvider)) {
          throw new Error(`Unsupported provider: ${normalizedProvider ?? "none"}`);
        }

        const callbackState = params.get("state");
        const issuedState = getIssuedSocialState(normalizedProvider);

        if (callbackState && issuedState && callbackState !== issuedState) {
          throw new Error("OAuth state mismatch.");
        }

        const state = issuedState ?? callbackState;

        if (requiresState(normalizedProvider) && !state) {
          throw new Error("Missing OAuth state.");
        }

        const verifyPayload: SubmitAuthCodeParams = {
          provider: normalizedProvider,
          authCode: code,
          state,
        };

        const response = await submitAuthCodeMutation.mutateAsync(verifyPayload);
        clearIssuedSocialState(normalizedProvider);

        setRecentLoginProvider(normalizedProvider);

        if (response.isRegistered) {
          const loginResponse = await socialLoginMutation.mutateAsync({
            socialVerifyToken: response.socialVerifyToken,
          });
          const loginAlert = buildLoginAlert(
            loginResponse.accountStatus,
            loginResponse.failCount,
            "/",
          );
          const accessToken =
            typeof loginResponse.accessToken === "string" &&
            loginResponse.accessToken.length > 0
              ? loginResponse.accessToken
              : null;

          if (!accessToken) {
            if (loginAlert) {
              const nextPath = "/auth/login";
              const tokens = {
                accessToken: null,
                socialVerifyToken: null,
              };

              setAuthTokens(tokens);
              setMessage("로그인 상태를 확인하고 있어요.");

              if (!redirectFromPopup(nextPath, tokens, normalizedProvider, loginAlert)) {
                setLoginAlert(loginAlert);
                navigate(nextPath, { replace: true });
              }
              return;
            }

            throw new Error("로그인 응답에 accessToken이 없습니다.");
          }

          const tokens = {
            accessToken,
            socialVerifyToken: null,
          };
          setAuthTokens(tokens);
          setMessage("로그인 완료!");
          if (!redirectFromPopup("/", tokens, normalizedProvider, loginAlert)) {
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
        if (isSocialProvider(normalizedProvider)) {
          clearIssuedSocialState(normalizedProvider);
        }
        setMessage("로그인에 실패했어요. 다시 시도해 주세요.");
        setErrorMessage(formatErrorMessage(error));
      } finally {
        clearLoginPopupTimer();
      }
    };

    void run();
  }, [
    clearLoginPopupTimer,
    navigate,
    normalizedProvider,
    setAuthTokens,
    setLoginAlert,
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
