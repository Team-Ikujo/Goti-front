import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import HomePage from '../../../../pages/home';
import LoginPage from '../../../../pages/login';
import SignUpPage from '../../../../pages/signup';
import ButtonPage from '@/pages/components/ui/ButtonPage';

const AppRouter = () => {
   return (
      <BrowserRouter>
         <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/button" element={<ButtonPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
         </Routes>
      </BrowserRouter>
   );
};

export default AppRouter;
