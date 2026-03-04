import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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

const AppRouter = () => {
  return (
    <BrowserRouter>
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
          <Route path="teams" element={<HomePage />} />
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
