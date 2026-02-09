import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '@/widgets/layout/auth';
import HomePage from '@/pages/home';
import AuthCallbackPage from '@/pages/auth/callback';
import LoginPage from '@/pages/auth/login';
import SignUpPage from '@/pages/signup';
import ButtonPage from '@/pages/components/ui/ButtonPage';

const AppRouter = () => {
   return (
      <BrowserRouter>
         <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthLayout />}>
               <Route path="login" element={<LoginPage />} />
               <Route path=":provider/callback" element={<AuthCallbackPage />} />
            </Route>
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/button" element={<ButtonPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
         </Routes>
      </BrowserRouter>
   );
};

export default AppRouter;
