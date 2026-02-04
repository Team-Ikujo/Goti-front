import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "../../../../pages/home";
import LoginPage from "../../../../pages/login";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
