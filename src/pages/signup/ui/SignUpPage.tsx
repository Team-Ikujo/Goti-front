import type { SignupGender } from '@/features/auth/api/authApi';
import {
   formatIdentityBirthDate,
   type IdentityVerificationFormValues,
} from '@/features/auth/model/identityVerificationForm';
import { useSendSignupSmsCode, useSocialSignup } from '@/features/auth/model/useSubmitAuthCode';
import IdentityVerificationForm from '@/features/auth/ui/IdentityVerificationForm';
import { useAuthStore } from '@/entities/auth/model/authStore';
import LoginRetryDialog from '@/pages/signup/ui/LoginRetryDialog';
import { ApiError } from '@/shared/api/client';
import { Snackbar } from '@/shared/ui/snackbar';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUpPage = () => {
   const navigate = useNavigate();
   const socialSignupMutation = useSocialSignup();
   const sendSignupSmsCodeMutation = useSendSignupSmsCode();
   const hasResolvedSession = useAuthStore(state => state.hasResolvedSession);
   const accessToken = useAuthStore(state => state.accessToken);
   const socialVerifyToken = useAuthStore(state => state.socialVerifyToken);
   const setAuthTokens = useAuthStore(state => state.setAuthTokens);
   const [showAlert, setShowAlert] = useState(false);
   const [showLoginRetryDialog, setShowLoginRetryDialog] = useState(false);
   const [submitError, setSubmitError] = useState<string | null>(null);

   useEffect(() => {
      if (!hasResolvedSession) {
         return;
      }

      if (accessToken) {
         navigate('/', { replace: true });
         return;
      }

      if (!socialVerifyToken) {
         navigate('/auth/login', { replace: true });
      }
   }, [accessToken, hasResolvedSession, navigate, socialVerifyToken]);

   useEffect(() => {
      if (!showAlert) return;

      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
   }, [showAlert]);

   const mapGender = (value: string): SignupGender => {
      switch (value) {
         case 'male':
            return 'MALE';
         case 'female':
            return 'FEMALE';
         default:
            throw new Error('성별 값이 올바르지 않습니다.');
      }
   };

   const handleSendCode = async (values: IdentityVerificationFormValues) => {
      setSubmitError(null);

      if (!socialVerifyToken) {
         setShowLoginRetryDialog(true);
         throw new Error('회원가입 세션이 만료되었습니다.');
      }

      try {
         await sendSignupSmsCodeMutation.mutateAsync({
            socialVerifyToken,
            mobile: values.phone.trim(),
         });
         setShowAlert(true);
      } catch (error) {
         if (error instanceof ApiError) {
            setSubmitError(error.message);
            throw error;
         }
         if (error instanceof Error) {
            setSubmitError(error.message);
            throw error;
         }
         setSubmitError('인증번호 발송 중 오류가 발생했습니다. 다시 시도해 주세요.');
         throw new Error('인증번호 발송 중 오류가 발생했습니다. 다시 시도해 주세요.');
      }
   };

   const handleSubmit = async (values: IdentityVerificationFormValues) => {
      setSubmitError(null);

      if (!socialVerifyToken) {
         setShowLoginRetryDialog(true);
         return;
      }

      try {
         const response = await socialSignupMutation.mutateAsync({
            socialVerifyToken,
            name: values.name,
            gender: mapGender(values.gender),
            mobile: values.phone,
            birthDate: formatIdentityBirthDate(values.birthDate),
            authCode: values.verificationCode,
         });

         setAuthTokens({
            accessToken: response.accessToken,
            socialVerifyToken: null,
         });
         navigate('/', { replace: true });
      } catch (error) {
         if (error instanceof ApiError) {
            setSubmitError(error.message);
            return;
         }
         if (error instanceof Error) {
            setSubmitError(error.message);
            return;
         }
         setSubmitError('회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.');
      }
   };

   return (
      <div className="flex min-h-screen items-center justify-center bg-white text-(--color-foreground)">
         <section className="w-full max-w-md p-8">
            <div className="pb-10 text-center">
               <h2 className="text-2xl font-semibold">본인 확인을 위해 </h2>
               <h2 className="text-2xl font-semibold">인증을 진행해주세요</h2>
            </div>

            <IdentityVerificationForm
               isSendingCode={sendSignupSmsCodeMutation.isPending}
               isSubmitting={socialSignupMutation.isPending}
               onSendCode={handleSendCode}
               onSubmit={handleSubmit}
            />

            {submitError && <p className="text-center text-sm text-destructive">{submitError}</p>}
         </section>

         <Snackbar open={showAlert} message="인증번호가 전송되었습니다." onClose={() => setShowAlert(false)} />

         <LoginRetryDialog
            open={showLoginRetryDialog}
            onOpenChange={setShowLoginRetryDialog}
            onConfirm={() => {
               setShowLoginRetryDialog(false);
               navigate('/auth/login', { replace: true });
            }}
         />
      </div>
   );
};

export default SignUpPage;
