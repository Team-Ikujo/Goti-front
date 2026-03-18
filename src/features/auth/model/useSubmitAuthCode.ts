import { useMutation } from "@tanstack/react-query";
import {
  issueSocialState,
  submitAuthCode,
} from "../api/oauthApi";
import {
  loginWithSocialVerifyToken,
  sendSignupSmsCode,
  signupWithSocialVerifyToken,
} from "../api/authApi";

export const useIssueSocialState = () => {
  return useMutation({
    mutationFn: issueSocialState,
  });
};

export const useSubmitAuthCode = () => {
  return useMutation({
    mutationFn: submitAuthCode,
  });
};

export const useSocialLogin = () => {
  return useMutation({
    mutationFn: loginWithSocialVerifyToken,
  });
};

export const useSocialSignup = () => {
  return useMutation({
    mutationFn: signupWithSocialVerifyToken,
  });
};

export const useSendSignupSmsCode = () => {
  return useMutation({
    mutationFn: sendSignupSmsCode,
  });
};
