import type { TermSignUpCode } from '@/entities/terms/model/types';
import { useTermDetailQuery, useTermsAgreementListQuery } from '@/entities/terms/model/useTermsQueries';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Option } from '@/shared/ui/option';
import { TermsCheckbox, TermsSubItem } from '@/shared/ui/terms-of-service';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
   getFieldErrorsFromZod,
   normalizeBirthDateInput,
   normalizePhoneInput,
   normalizeVerificationCodeInput,
   sendCodeSchema,
   signUpSchema,
   telecomOptions,
   type SignUpFieldErrors,
} from '@/pages/signup/model/signUpValidation';
import SignUpTermsDialog from '@/pages/signup/ui/SignUpTermsDialog';
import VerificationCodeField from '@/pages/signup/ui/VerificationCodeField';

const SignUpPage = () => {
   const navigate = useNavigate();
   const termsSignuptListQuery = useTermsAgreementListQuery('signup');
   const signups = termsSignuptListQuery.data ?? [];

   const [checkedByCode, setCheckedByCode] = useState<Partial<Record<TermSignUpCode, boolean>>>({});
   const [selected, setSelected] = useState<string | null>(null);

   const [name, setName] = useState('');
   const [birthDate, setBirthDate] = useState('');
   const [gender, setGender] = useState<string | null>(null);
   const [telecom, setTelecom] = useState<string | null>(null);
   const [phone, setPhone] = useState('');
   const [verificationCode, setVerificationCode] = useState('');
   const [countdown, setCountdown] = useState(0);

   const [isCodeSent, setIsCodeSent] = useState(false);
   const [showAlert, setShowAlert] = useState(false);
   const [submitted, setSubmitted] = useState(false);
   const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({});

   const [detailTargetCode, setDetailTargetCode] = useState<TermSignUpCode | null>(null);
   const termDetailQuery = useTermDetailQuery(detailTargetCode);
   const [detailTriggerElement, setDetailTriggerElement] = useState<HTMLElement | null>(null);

   const areRequiredTermsChecked = useMemo(() => {
      return signups.every(signup => {
         if (!signup.required) return true;
         return checkedByCode[signup.code] === true;
      });
   }, [signups, checkedByCode]);

   const isAllChecked = useMemo(() => {
      return signups.length > 0 && signups.every(signup => checkedByCode[signup.code] === true);
   }, [signups, checkedByCode]);

   const handleAllCheckedChange = (checked: boolean) => {
      const nextState: Partial<Record<TermSignUpCode, boolean>> = {};
      signups.forEach(signup => {
         nextState[signup.code] = checked;
      });
      setCheckedByCode(nextState);
   };

   const handleSendCode = () => {
      const result = sendCodeSchema.safeParse({
         name: name.trim(),
         nationality: selected ?? '',
         birthDate: birthDate.trim(),
         telecom: telecom ?? '',
         phone: phone.trim(),
         requiredTermsAgreed: areRequiredTermsChecked,
      });

      if (!result.success) {
         setSubmitted(true);
         setFieldErrors(prev => ({ ...prev, ...getFieldErrorsFromZod(result.error) }));
         return;
      }

      setFieldErrors(prev => ({ ...prev, phone: undefined, requiredTermsAgreed: undefined }));
      setIsCodeSent(true);
      setShowAlert(true);
      setCountdown(180);
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
         name: name.trim(),
         nationality: selected ?? '',
         birthDate: birthDate.trim(),
         telecom: telecom ?? '',
         phone: phone.trim(),
         requiredTermsAgreed: areRequiredTermsChecked,
      }).success;
   }, [name, selected, birthDate, telecom, phone, areRequiredTermsChecked]);

   useEffect(() => {
      if (!showAlert) return;
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
   }, [showAlert]);

   const handleSubmit = () => {
      setSubmitted(true);

      const result = signUpSchema.safeParse({
         name: name.trim(),
         nationality: selected ?? '',
         birthDate: birthDate.trim(),
         gender: gender ?? '',
         telecom: telecom ?? '',
         phone: phone.trim(),
         verificationCode: verificationCode.trim(),
         requiredTermsAgreed: areRequiredTermsChecked,
      });

      if (!result.success) {
         setFieldErrors(getFieldErrorsFromZod(result.error));
         return;
      }

      setFieldErrors({});
      navigate('/');
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
            <div className="text-center">
               <h2 className="text-2xl font-semibold">본인 확인을 위해 </h2>
               <h2 className="text-2xl font-semibold">인증을 진행해주세요</h2>
            </div>
            <form className="space-y-5" onSubmit={e => e.preventDefault()}>
               <Input
                  label="이름"
                  required
                  placeholder="30자 이내 입력"
                  value={name}
                  onChange={e => {
                     setName(e.target.value);
                     setFieldErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  error={submitted && Boolean(fieldErrors.name)}
                  helpText={submitted ? fieldErrors.name : undefined}
               />

               <div className="text-(--label-2-medium) text-[14px] flex flex-col gap-1">
                  국적
                  <div className="flex items-center gap-2">
                     <Option
                        active={selected === 'local'}
                        onClick={() => {
                           setSelected('local');
                           setFieldErrors(prev => ({ ...prev, nationality: undefined }));
                        }}
                        className="w-full"
                     >
                        내국인
                     </Option>
                     <Option
                        active={selected === 'foreigner'}
                        onClick={() => {
                           setSelected('foreigner');
                           setFieldErrors(prev => ({ ...prev, nationality: undefined }));
                        }}
                        className="w-full"
                     >
                        외국인
                     </Option>
                  </div>
                  {submitted && fieldErrors.nationality && <p className="text-xs text-destructive antialiased">{fieldErrors.nationality}</p>}
               </div>

               <Input
                  label="생년월일"
                  required
                  placeholder="예: 19990101 (8자리)"
                  value={birthDate}
                  onChange={e => {
                     setBirthDate(normalizeBirthDateInput(e.target.value));
                     setFieldErrors(prev => ({ ...prev, birthDate: undefined }));
                  }}
                  error={submitted && Boolean(fieldErrors.birthDate)}
                  helpText={submitted ? fieldErrors.birthDate : undefined}
               />

               <div className="text-(--label-2-medium) text-[14px] flex flex-col gap-1">
                  성별
                  <div className="flex items-center gap-2">
                     <Option
                        active={gender === 'male'}
                        onClick={() => {
                           setGender('male');
                           setFieldErrors(prev => ({ ...prev, gender: undefined }));
                        }}
                        className="w-full"
                     >
                        남성
                     </Option>
                     <Option
                        active={gender === 'female'}
                        onClick={() => {
                           setGender('female');
                           setFieldErrors(prev => ({ ...prev, gender: undefined }));
                        }}
                        className="w-full"
                     >
                        여성
                     </Option>
                  </div>
                  {submitted && fieldErrors.gender && <p className="text-xs text-destructive antialiased">{fieldErrors.gender}</p>}
               </div>

               <div className="text-(--label-2-medium) text-[14px] flex flex-col gap-1">
                  통신사
                  <div className="grid grid-cols-3 gap-2">
                     {telecomOptions.map(option => (
                        <Option
                           key={option.id}
                           active={telecom === option.id}
                           onClick={() => {
                              setTelecom(option.id);
                              setFieldErrors(prev => ({ ...prev, telecom: undefined }));
                           }}
                           className="w-full"
                        >
                           {option.name}
                        </Option>
                     ))}
                  </div>
                  {submitted && fieldErrors.telecom && <p className="text-xs text-destructive antialiased">{fieldErrors.telecom}</p>}
               </div>

               <Input
                  label="휴대폰 번호"
                  required
                  placeholder="'-'를 제외한 숫자만 입력"
                  value={phone}
                  onChange={e => {
                     setPhone(normalizePhoneInput(e.target.value));
                     setFieldErrors(prev => ({ ...prev, phone: undefined }));
                  }}
                  error={submitted && Boolean(fieldErrors.phone)}
                  helpText={submitted ? fieldErrors.phone : undefined}
               />

               {isCodeSent && (
                  <VerificationCodeField
                     value={verificationCode}
                     onChange={value => {
                        setVerificationCode(normalizeVerificationCodeInput(value));
                        setFieldErrors(prev => ({ ...prev, verificationCode: undefined }));
                     }}
                     submitted={submitted}
                     errorMessage={fieldErrors.verificationCode}
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
                           setFieldErrors(prev => ({ ...prev, requiredTermsAgreed: undefined }));
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
                     {submitted && fieldErrors.requiredTermsAgreed && (
                        <p className="text-xs text-destructive antialiased">{fieldErrors.requiredTermsAgreed}</p>
                     )}
                  </div>
               )}

               {!isCodeSent ? (
                  <Button
                     type="button"
                     variant="primary"
                     className="w-full"
                     disabled={!canSendCode}
                     onClick={handleSendCode}
                  >
                     인증 번호 전송
                  </Button>
               ) : (
                  <Button type="button" variant="primary" className="w-full" onClick={handleSubmit}>
                     완료
                  </Button>
               )}
            </form>

            <SignUpTermsDialog
               open={Boolean(detailTargetCode)}
               isLoading={termDetailQuery.isLoading}
               detail={termDetailQuery.data ?? undefined}
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
      </div>
   );
};

export default SignUpPage;
