import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/entities/auth/model/authStore";
import AuthLayout from "@/shared/widgets/layout/auth";
import HomePage from "@/pages/home";
import AuthCallbackPage from "@/pages/auth/callback";
import LoginPage from "@/pages/auth/login";
import SignUpPage from "@/pages/signup";
import VerificationFlowPage from "@/pages/auth/verification-flow";
import ButtonPage from "@/pages/components/ui/ButtonPage";
import ControlPage from "@/pages/components/ui/ControlPage";
import AlertPage from "@/pages/components/ui/AlertPage";
import OptionPage from "@/pages/components/ui/OptionPage";
import PopupPage from "@/pages/components/ui/PopupPage";
import TooltipPage from "@/pages/components/ui/TooltipPage";
import InputPage from "@/pages/components/ui/InputPage";
import ToSPage from "@/pages/components/ui/ToSPage";
import HomeLayout from "@/shared/widgets/layout/home";
import Chip from "@/pages/components/ui/ChipPage";
import ListPage from "@/pages/components/ui/ListPage";
import TeamsPage from "@/pages/teams";

// 팝업 OAuth 로그인 완료 시 토큰을 받아 store에 저장하고 SPA 이동
const OAuthMessageListener = () => {
  const navigate = useNavigate();
  const setAuthTokens = useAuthStore((s) => s.setAuthTokens);
  const setRecentLoginProvider = useAuthStore((s) => s.setRecentLoginProvider);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "__OAUTH_SUCCESS__") return;
      setAuthTokens({
        accessToken: event.data.accessToken,
        tempToken: event.data.tempToken,
        isLinked: event.data.isLinked,
      });
      if (event.data.provider) setRecentLoginProvider(event.data.provider);
      navigate(event.data.redirectPath ?? "/", { replace: true });
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [navigate, setAuthTokens, setRecentLoginProvider]);

  return null;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <OAuthMessageListener />
      <Routes>
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="terms" element={<VerificationFlowPage />} />
          <Route path="signup" element={<SignUpPage />} />
          <Route path=":provider/callback" element={<AuthCallbackPage />} />
        </Route>
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/signup" element={<Navigate to="/auth/terms" replace />} />
        <Route
          path="/auth/verification-flow"
          element={<Navigate to="/auth/terms" replace />}
        />
        <Route path="/" element={<HomeLayout />}>
          <Route index element={<HomePage />} />
          <Route path="teams" element={<TeamsPage />} />
        </Route>
        <Route path="/button" element={<ButtonPage />} />
        <Route path="/control" element={<ControlPage />} />
        <Route path="/alert" element={<AlertPage />} />
        <Route path="/option" element={<OptionPage />} />
        <Route path="/popup" element={<PopupPage />} />
        <Route path="/tooltip" element={<TooltipPage />} />
        <Route path="/input" element={<InputPage />} />
        <Route path="/tos" element={<ToSPage />} />
        <Route path="/list" element={<ListPage />} />
        <Route path="/chip" element={<Chip />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
