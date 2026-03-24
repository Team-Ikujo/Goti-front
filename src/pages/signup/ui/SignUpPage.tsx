import { zodResolver } from '@hookform/resolvers/zod';
import { useSendSignupSmsCode, useSocialSignup } from '@/features/auth/model/useSubmitAuthCode';
import { useAuthStore } from '@/entities/auth/model/authStore';
import type { TermSignUpCode } from '@/entities/terms/model/types';
import {
   getFieldErrorsFromZod,
   normalizeBirthDateInput,
   normalizePhoneInput,
   normalizeVerificationCodeInput,
   sendCodeSchema,
   signUpSchema,
   telecomOptions,
   type SignUpFormValues,
} from '@/pages/signup/model/signUpValidation';
import {
   signUpTermsAgreements,
   signUpTermsDetailByCode,
} from '@/pages/signup/model/signUpTerms';
import LoginRetryDialog from '@/pages/signup/ui/LoginRetryDialog';
import SignUpTermsDialog from '@/pages/signup/ui/SignUpTermsDialog';
import VerificationCodeField from '@/pages/signup/ui/VerificationCodeField';
import { ApiError } from '@/shared/api/client';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Option } from '@/shared/ui/option';
import { TermsCheckbox, TermsSubItem } from '@/shared/ui/terms-of-service';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

const SignUpPage = () => {
   const navigate = useNavigate();
   const socialSignupMutation = useSocialSignup();
   const sendSignupSmsCodeMutation = useSendSignupSmsCode();
   const accessToken = useAuthStore(state => state.accessToken);
   const socialVerifyToken = useAuthStore(state => state.socialVerifyToken);
   const setAuthTokens = useAuthStore(state => state.setAuthTokens);
   const signups = signUpTermsAgreements;

   const [checkedByCode, setCheckedByCode] = useState<Partial<Record<TermSignUpCode, boolean>>>({});
   const [countdown, setCountdown] = useState(0);
   const [isCodeSent, setIsCodeSent] = useState(false);
   const [showAlert, setShowAlert] = useState(false);
   const [showLoginRetryDialog, setShowLoginRetryDialog] = useState(false);
   const [submitError, setSubmitError] = useState<string | null>(null);

   const [detailTargetCode, setDetailTargetCode] = useState<TermSignUpCode | null>(null);
   const termDetail = detailTargetCode ? signUpTermsDetailByCode[detailTargetCode] : null;
   const [detailTriggerElement, setDetailTriggerElement] = useState<HTMLElement | null>(null);

   const {
      setValue,
      watch,
      setError,
      clearErrors,
      getValues,
      handleSubmit,
      formState: { errors },
   } = useForm<SignUpFormValues>({
      resolver: zodResolver(signUpSchema),
      defaultValues: {
         name: '',
         nationality: '',
         birthDate: '',
         gender: '',
         telecom: '',
         phone: '',
         verificationCode: '',
         requiredTermsAgreed: false,
      },
   });

   const values = watch();

   const areRequiredTermsChecked = useMemo(() => {
      return signups.every(signup => {
         if (!signup.required) return true;
         return checkedByCode[signup.code] === true;
      });
   }, [signups, checkedByCode]);

   const isAllChecked = useMemo(() => {
      return signups.length > 0 && signups.every(signup => checkedByCode[signup.code] === true);
   }, [signups, checkedByCode]);

   useEffect(() => {
      setValue('requiredTermsAgreed', areRequiredTermsChecked, { shouldValidate: false });
   }, [areRequiredTermsChecked, setValue]);

   const handleAllCheckedChange = (checked: boolean) => {
      const nextState: Partial<Record<TermSignUpCode, boolean>> = {};
      signups.forEach(signup => {
         nextState[signup.code] = checked;
      });
      setCheckedByCode(nextState);
      clearErrors('requiredTermsAgreed');
   };

   const handleSendCode = async () => {
      const result = sendCodeSchema.safeParse({
         name: getValues('name').trim(),
         nationality: getValues('nationality') ?? '',
         birthDate: getValues('birthDate').trim(),
         telecom: getValues('telecom') ?? '',
         phone: getValues('phone').trim(),
         requiredTermsAgreed: areRequiredTermsChecked,
      });

      if (!result.success) {
         const nextErrors = getFieldErrorsFromZod(result.error);
         Object.entries(nextErrors).forEach(([field, message]) => {
            if (!message) return;
            setError(field as keyof SignUpFormValues, {
               type: 'manual',
               message,
            });
         });
         return;
      }

      if (!socialVerifyToken) {
         setShowLoginRetryDialog(true);
         return;
      }

      clearErrors(['phone', 'requiredTermsAgreed']);

      try {
         await sendSignupSmsCodeMutation.mutateAsync({
            socialVerifyToken,
            mobile: getValues('phone').trim(),
         });

         setIsCodeSent(true);
         setShowAlert(true);
         setCountdown(180);
      } catch (error) {
         if (error instanceof ApiError) {
            setSubmitError(error.message);
            return;
         }
         if (error instanceof Error) {
            setSubmitError(error.message);
            return;
         }
         setSubmitError('인증번호 발송 중 오류가 발생했습니다. 다시 시도해 주세요.');
      }
   };

   useEffect(() => {
      if (countdown <= 0) return;
      const timer = setInterval(() => {
         setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
   }, [countdown]);

   const formattedCountdown = useMemo(() => {
      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
   }, [countdown]);

   const canSendCode = useMemo(() => {
      return sendCodeSchema.safeParse({
         name: values.name.trim(),
         nationality: values.nationality ?? '',
         birthDate: values.birthDate.trim(),
         telecom: values.telecom ?? '',
         phone: values.phone.trim(),
         requiredTermsAgreed: areRequiredTermsChecked,
      }).success;
   }, [areRequiredTermsChecked, values.birthDate, values.name, values.nationality, values.phone, values.telecom]);

   useEffect(() => {
      if (accessToken) {
         navigate('/', { replace: true });
         return;
      }

      if (!socialVerifyToken) {
         navigate('/auth/login', { replace: true });
      }
   }, [accessToken, navigate, socialVerifyToken]);

   useEffect(() => {
      if (!showAlert) return;
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
   }, [showAlert]);

   const formatBirthDate = (value: string) => {
      return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
   };

   const mapGender = (value: string) => {
      switch (value) {
         case 'male':
            return 'MALE' as const;
         case 'female':
            return 'FEMALE' as const;
         default:
            throw new Error('성별 값이 올바르지 않습니다.');
      }
   };

   const onSubmit = async (data: SignUpFormValues) => {
      setSubmitError(null);

      if (!socialVerifyToken) {
         setShowLoginRetryDialog(true);
         return;
      }

      try {
         const response = await socialSignupMutation.mutateAsync({
            socialVerifyToken,
            name: data.name,
            gender: mapGender(data.gender),
            mobile: data.phone,
            birthDate: formatBirthDate(data.birthDate),
            authCode: data.verificationCode,
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

   const closeDetailDialog = () => {
      setDetailTargetCode(null);
      if (detailTriggerElement) {
         requestAnimationFrame(() => {
            detailTriggerElement.focus();
         });
      }
   };

   const handleOpenDetail = (code: TermSignUpCode, trigger?: HTMLElement) => {
      if (trigger) setDetailTriggerElement(trigger);
      setDetailTargetCode(code);
   };

   const handleAgreeAndClose = () => {
      if (detailTargetCode) {
         setCheckedByCode(prev => ({ ...prev, [detailTargetCode]: true }));
      }
      closeDetailDialog();
   };

   return (
      <div className="min-h-screen bg-white text-(--color-foreground) flex items-center justify-center">
         <section className="w-full max-w-md p-8">
            <div className="text-center pb-10">
               <h2 className="text-2xl font-semibold">본인 확인을 위해 </h2>
               <h2 className="text-2xl font-semibold">인증을 진행해주세요</h2>
            </div>
            <form className="space-y-5" onSubmit={e => e.preventDefault()}>
               <Input
                  label="이름"
                  required
                  placeholder="30자 이내 입력"
                  maxLength={30}
                  value={values.name}
                  onChange={e => {
                     setValue('name', e.target.value.slice(0, 30), { shouldDirty: true });
                     clearErrors('name');
                  }}
                  error={Boolean(errors.name)}
                  helpText={errors.name?.message}
               />

               <div className="text-(--label-2-medium) text-[14px] flex flex-col gap-1">
                  <div className="flex">
                     국적 <div className="text-primary">*</div>
                  </div>
                  <div className="flex items-center gap-2">
                     <Option
                        active={values.nationality === 'local'}
                        onClick={() => {
                           setValue('nationality', 'local', { shouldDirty: true });
                           clearErrors('nationality');
                        }}
                        className="w-full"
                     >
                        내국인
                     </Option>
                     <Option
                        active={values.nationality === 'foreigner'}
                        onClick={() => {
                           setValue('nationality', 'foreigner', { shouldDirty: true });
                           clearErrors('nationality');
                        }}
                        className="w-full"
                     >
                        외국인
                     </Option>
                  </div>
                  {errors.nationality && (
                     <p className="text-xs text-destructive antialiased">{errors.nationality.message}</p>
                  )}
               </div>

               <Input
                  label="생년월일"
                  required
                  placeholder="예: 19990101 (8자리)"
                  value={values.birthDate}
                  onChange={e => {
                     setValue('birthDate', normalizeBirthDateInput(e.target.value), { shouldDirty: true });
                     clearErrors('birthDate');
                  }}
                  error={Boolean(errors.birthDate)}
                  helpText={errors.birthDate?.message}
               />

               <div className="text-(--label-2-medium) text-[14px] flex flex-col gap-1">
                  <div className="flex">
                     성별 <div className="text-primary">*</div>
                  </div>
                  <div className="flex items-center gap-2">
                     <Option
                        active={values.gender === 'male'}
                        onClick={() => {
                           setValue('gender', 'male', { shouldDirty: true });
                           clearErrors('gender');
                        }}
                        className="w-full"
                     >
                        남성
                     </Option>
                     <Option
                        active={values.gender === 'female'}
                        onClick={() => {
                           setValue('gender', 'female', { shouldDirty: true });
                           clearErrors('gender');
                        }}
                        className="w-full"
                     >
                        여성
                     </Option>
                  </div>
                  {errors.gender && <p className="text-xs text-destructive antialiased">{errors.gender.message}</p>}
               </div>

               <div className="text-(--label-2-medium) text-[14px] flex flex-col gap-1">
                  <div className="flex">
                     통신사 <div className="text-primary">*</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                     {telecomOptions.map(option => (
                        <Option
                           key={option.id}
                           active={values.telecom === option.id}
                           onClick={() => {
                              setValue('telecom', option.id, { shouldDirty: true });
                              clearErrors('telecom');
                           }}
                           className="w-full"
                        >
                           {option.name}
                        </Option>
                     ))}
                  </div>
                  {errors.telecom && <p className="text-xs text-destructive antialiased">{errors.telecom.message}</p>}
               </div>

               <Input
                  label="휴대폰 번호"
                  required
                  placeholder="'-'를 제외한 숫자만 입력"
                  value={values.phone}
                  onChange={e => {
                     setValue('phone', normalizePhoneInput(e.target.value), { shouldDirty: true });
                     clearErrors('phone');
                  }}
                  error={Boolean(errors.phone)}
                  helpText={errors.phone?.message}
               />

               {isCodeSent && (
                  <VerificationCodeField
                     value={values.verificationCode}
                     onChange={value => {
                        setValue('verificationCode', normalizeVerificationCodeInput(value), { shouldDirty: true });
                        clearErrors('verificationCode');
                     }}
                     submitted={true}
                     errorMessage={errors.verificationCode?.message}
                     countdown={countdown}
                     formattedCountdown={formattedCountdown}
                     onResend={handleSendCode}
                  />
               )}

               {!isCodeSent && (
                  <div className="flex flex-col gap-1 w-95 justify-center">
                     <TermsCheckbox
                        id="terms-all"
                        label="전체 동의"
                        checked={isAllChecked}
                        onChange={checked => {
                           handleAllCheckedChange(checked);
                           clearErrors('requiredTermsAgreed');
                        }}
                     />
                     <div>
                        {signups.map(signup => (
                           <TermsSubItem
                              key={signup.code}
                              id={`term-${signup.code}`}
                              label={signup.label}
                              checked={Boolean(checkedByCode[signup.code])}
                              onChange={checked =>
                                 setCheckedByCode(prev => ({
                                    ...prev,
                                    [signup.code]: checked === true,
                                 }))
                              }
                              showTrigger={signup.hasDetail}
                              onTrigger={() => handleOpenDetail(signup.code)}
                           />
                        ))}
                     </div>
                     {errors.requiredTermsAgreed && (
                        <p className="text-xs text-destructive antialiased">{errors.requiredTermsAgreed.message}</p>
                     )}
                  </div>
               )}

               {!isCodeSent ? (
                  <Button
                     type="button"
                     variant="primary"
                     className="w-full"
                     disabled={!canSendCode || sendSignupSmsCodeMutation.isPending}
                     onClick={() => void handleSendCode()}
                  >
                     인증 번호 전송
                  </Button>
               ) : (
                  <Button
                     type="button"
                     variant="primary"
                     className="w-full"
                     onClick={() => void handleSubmit(onSubmit)()}
                  >
                     완료
                  </Button>
               )}

               {submitError ? <p className="text-xs text-destructive antialiased">{submitError}</p> : null}
            </form>

            <SignUpTermsDialog
               open={Boolean(detailTargetCode)}
               detail={termDetail ?? undefined}
               onOpenChange={open => {
                  if (!open) closeDetailDialog();
               }}
               onAgreeAndClose={handleAgreeAndClose}
            />
         </section>

         {showAlert && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <Alert variant="success">인증번호가 전송되었어요</Alert>
            </div>
         )}

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
