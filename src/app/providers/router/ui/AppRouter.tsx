import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '@/shared/widgets/layout/auth';
import HomePage from '@/pages/home';
import AuthCallbackPage from '@/pages/auth/callback';
import LoginPage from '@/pages/auth/login';
import SignUpPage from '@/pages/signup';
import VerificationFlowPage from '@/pages/auth/verification-flow';
import QueuePage from '@/pages/queue';
import ButtonPage from '@/pages/components/ui/ButtonPage';
import ControlPage from '@/pages/components/ui/ControlPage';
import AlertPage from '@/pages/components/ui/AlertPage';
import OptionPage from '@/pages/components/ui/OptionPage';
import PopupPage from '@/pages/components/ui/PopupPage';
import TooltipPage from '@/pages/components/ui/TooltipPage';
import InputPage from '@/pages/components/ui/InputPage';
import ToSPage from '@/pages/components/ui/ToSPage';
import HomeLayout from '@/shared/widgets/layout/home';
import BooksLayout from '@/shared/widgets/layout/books';
import Chip from '@/pages/components/ui/ChipPage';
import ListPage from '@/pages/components/ui/ListPage';
import ErrorPage from '@/pages/error';
import ErrorTestHubPage from '@/pages/error/ui/ErrorTestHubPage';
import TeamsPage from '@/pages/teams';
import TeamDetailPage from '@/pages/teams/ui/TeamDetailPage';
import TicketsPage from '@/pages/tickets';
import TicketPaymentPage from '@/pages/tickets/ui/payment/TicketPaymentPage';
import ResellPaymentPage from '@/pages/tickets/ui/payment/ResellPaymentPage';
import PaymentProcessingPage from '@/pages/tickets/ui/payment/PaymentProcessingPage';
import PaymentCompletePage from '@/pages/tickets/ui/payment/PaymentCompletePage';
import BooksPage from '@/pages/books';
import SeatsPage from '@/pages/books/ui/SeatsPage';
import ResellBooksPage from '@/pages/resell-books';
import ResellSeatsPage from '@/pages/resell-books/ui/ResellSeatsPage';
import SeatHoldLifecycleController from '@/features/seat-booking/ui/SeatHoldLifecycleController';
import {
   MypagePage,
   AccountPage,
   ProfileIdentityEditPage,
   PurchaseDetailPage,
   SaleDetailPage,
} from '@/pages/mypage';
import MypageLayout from '@/shared/widgets/layout/mypage/MypageLayout';
import AuthSessionController from './AuthSessionController';
import BookingFlowStateGuard from './BookingFlowStateGuard';
import OAuthMessageListener from './OAuthMessageListener';
import SessionExpiredPage from '@/pages/session-expired/ui/SessionExpiredPage';

const AppRouter = () => {
   return (
      <BrowserRouter>
         <AuthSessionController />
         <OAuthMessageListener />
         <BookingFlowStateGuard />
         <SeatHoldLifecycleController />
         <Routes>
            <Route path="/auth" element={<AuthLayout />}>
               <Route path="login" element={<LoginPage />} />
               <Route path="terms" element={<VerificationFlowPage />} />
               <Route path="signup" element={<SignUpPage />} />
               <Route path=":provider/callback" element={<AuthCallbackPage />} />
            </Route>
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />
            <Route path="/signup" element={<Navigate to="/auth/terms" replace />} />
            <Route path="/auth/verification-flow" element={<Navigate to="/auth/terms" replace />} />
            <Route path="/error-test" element={<ErrorTestHubPage />} />
            <Route path="/error-test/:statusCode" element={<ErrorPage />} />
            <Route path="/error/:statusCode" element={<ErrorPage />} />
            <Route path="/" element={<HomeLayout />}>
               <Route index element={<HomePage />} />
               <Route path="tickets" element={<TicketsPage />} />
               <Route path="teams" element={<TeamsPage />} />
               <Route path="teams/:teamId" element={<TeamDetailPage />} />
            </Route>
            <Route path="/tickets/payment" element={<TicketPaymentPage />} />
            <Route path="/tickets/resell-payment" element={<ResellPaymentPage />} />
            <Route path="/tickets/payment/processing" element={<PaymentProcessingPage />} />
            {/* ?delivery=mobile|onsite|delivery */}
            <Route path="/tickets/payment/complete" element={<PaymentCompletePage />} />
            <Route path="/mypage" element={<MypageLayout />}>
               <Route index element={<MypagePage />} />
               <Route path="account" element={<AccountPage />} />
               <Route path="purchase/:id" element={<PurchaseDetailPage />} />
               <Route path="sale/:id" element={<SaleDetailPage />} />
            </Route>
            <Route path="/mypage/account/identity" element={<ProfileIdentityEditPage />} />
            <Route path="/books" element={<BooksLayout />}>
               <Route index element={<BooksPage />} />
               <Route path="seats/:zoneId" element={<SeatsPage />} />
            </Route>
            <Route path="/resell-books" element={<BooksLayout />}>
               <Route index element={<ResellBooksPage />} />
               <Route path="seats/:zoneId" element={<ResellSeatsPage />} />
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
            <Route path="/session-expired" element={<SessionExpiredPage />} />
            <Route path="/queue" element={<QueuePage />} />
            <Route path="*" element={<Navigate to="/error/404" replace />} />
         </Routes>
      </BrowserRouter>
   );
};

export default AppRouter;
