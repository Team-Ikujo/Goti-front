import type { SignupGender } from '@/features/auth/api/authApi';
import {
   formatIdentityBirthDate,
   type IdentityVerificationFormValues,
} from '@/features/auth/model/identityVerificationForm';
import {
   useSendProfileEditSmsCode,
   useSubmitProfileIdentityEdit,
} from '@/features/auth/model/useProfileIdentityEdit';
import IdentityVerificationForm from '@/features/auth/ui/IdentityVerificationForm';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { ApiError } from '@/shared/api/client';
import { Alert } from '@/shared/ui/alert';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type ProfileEditLocationState = {
   name?: string;
   phone?: string;
};

const ProfileIdentityEditPage = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const queryClient = useQueryClient();
   const hasResolvedSession = useAuthStore(state => state.hasResolvedSession);
   const accessToken = useAuthStore(state => state.accessToken);
   const sendProfileEditSmsMutation = useSendProfileEditSmsCode();
   const submitProfileEditMutation = useSubmitProfileIdentityEdit();
   const profileEditState = (location.state as ProfileEditLocationState | null) ?? null;
   const [showAlert, setShowAlert] = useState(false);
   const [submitError, setSubmitError] = useState<string | null>(null);

   useEffect(() => {
      if (!hasResolvedSession) {
         return;
      }

      if (!accessToken) {
         navigate('/auth/login', { replace: true });
      }
   }, [accessToken, hasResolvedSession, navigate]);

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

   const handleSendCode = async () => {
      setSubmitError(null);

      try {
         await sendProfileEditSmsMutation.mutateAsync();
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

      try {
         await submitProfileEditMutation.mutateAsync({
            name: values.name,
            gender: mapGender(values.gender),
            mobile: values.phone,
            birthDate: formatIdentityBirthDate(values.birthDate),
         });
         await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
         navigate('/mypage/account', { replace: true });
      } catch (error) {
         if (error instanceof ApiError) {
            setSubmitError(error.message);
            return;
         }
         if (error instanceof Error) {
            setSubmitError(error.message);
            return;
         }
         setSubmitError('개인정보 수정 중 오류가 발생했습니다. 다시 시도해 주세요.');
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
               defaultValues={{
                  name: profileEditState?.name ?? '',
                  phone: profileEditState?.phone ?? '',
               }}
               isSendingCode={sendProfileEditSmsMutation.isPending}
               isSubmitting={submitProfileEditMutation.isPending}
               onSendCode={async () => {
                  await handleSendCode();
               }}
               onSubmit={handleSubmit}
            />

            {submitError && <p className="text-center text-sm text-destructive">{submitError}</p>}
         </section>

         <Alert
            open={showAlert}
            title="인증 번호 전송"
            description="인증번호가 전송되었습니다."
            onOpenChange={open => {
               if (!open) {
                  setShowAlert(false);
               }
            }}
         />
      </div>
   );
};

export default ProfileIdentityEditPage;
