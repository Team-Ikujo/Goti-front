import type { TermSignUpCode } from '@/entities/terms/model/types';
import {
   getFieldErrorsFromZod,
   identityVerificationSchema,
   normalizeBirthDateInput,
   normalizePhoneInput,
   normalizeVerificationCodeInput,
   sendCodeSchema,
   telecomOptions,
   type IdentityVerificationFormValues,
} from '@/features/auth/model/identityVerificationForm';
import {
   identityVerificationTermsAgreements,
   identityVerificationTermsDetailByCode,
} from '@/features/auth/model/identityVerificationTerms';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Option } from '@/shared/ui/option';
import { TermsCheckbox, TermsSubItem } from '@/shared/ui/terms-of-service';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import IdentityVerificationTermsDialog from './IdentityVerificationTermsDialog';
import VerificationCodeField from './VerificationCodeField';

type IdentityVerificationFormProps = {
   defaultValues?: Partial<IdentityVerificationFormValues>;
   submitLabel?: string;
   isSendingCode?: boolean;
   isSubmitting?: boolean;
   onSendCode: (values: IdentityVerificationFormValues) => Promise<void>;
   onSubmit: (values: IdentityVerificationFormValues) => Promise<void>;
};

const IdentityVerificationForm = ({
   defaultValues,
   submitLabel = '완료',
   isSendingCode = false,
   isSubmitting = false,
   onSendCode,
   onSubmit,
}: IdentityVerificationFormProps) => {
   const [checkedByCode, setCheckedByCode] = useState<Partial<Record<TermSignUpCode, boolean>>>({});
   const [countdown, setCountdown] = useState(0);
   const [isCodeSent, setIsCodeSent] = useState(false);
   const [detailTargetCode, setDetailTargetCode] = useState<TermSignUpCode | null>(null);
   const [detailTriggerElement, setDetailTriggerElement] = useState<HTMLElement | null>(null);
   const termDetail = detailTargetCode ? identityVerificationTermsDetailByCode[detailTargetCode] : null;

   const {
      setValue,
      watch,
      setError,
      clearErrors,
      getValues,
      handleSubmit,
      formState: { errors },
   } = useForm<IdentityVerificationFormValues>({
      resolver: zodResolver(identityVerificationSchema),
      defaultValues: {
         name: defaultValues?.name ?? '',
         nationality: defaultValues?.nationality ?? '',
         birthDate: defaultValues?.birthDate ?? '',
         gender: defaultValues?.gender ?? '',
         telecom: defaultValues?.telecom ?? '',
         phone: defaultValues?.phone ?? '',
         verificationCode: defaultValues?.verificationCode ?? '',
         requiredTermsAgreed: false,
      },
   });

   const values = watch();

   const areRequiredTermsChecked = useMemo(() => {
      return identityVerificationTermsAgreements.every(term => {
         if (!term.required) return true;
         return checkedByCode[term.code] === true;
      });
   }, [checkedByCode]);

   const isAllChecked = useMemo(() => {
      return (
         identityVerificationTermsAgreements.length > 0 &&
         identityVerificationTermsAgreements.every(term => checkedByCode[term.code] === true)
      );
   }, [checkedByCode]);

   useEffect(() => {
      setValue('requiredTermsAgreed', areRequiredTermsChecked, { shouldValidate: false });
   }, [areRequiredTermsChecked, setValue]);

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

   const handleAllCheckedChange = (checked: boolean) => {
      const nextState: Partial<Record<TermSignUpCode, boolean>> = {};
      identityVerificationTermsAgreements.forEach(term => {
         nextState[term.code] = checked;
      });
      setCheckedByCode(nextState);
      clearErrors('requiredTermsAgreed');
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

   const handleRequestCode = async () => {
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
            setError(field as keyof IdentityVerificationFormValues, {
               type: 'manual',
               message,
            });
         });
         return;
      }

      clearErrors(['phone', 'requiredTermsAgreed']);
      await onSendCode({
         ...getValues(),
         requiredTermsAgreed: areRequiredTermsChecked,
      });
      setIsCodeSent(true);
      setCountdown(180);
   };

   return (
      <>
         <form className="space-y-5" onSubmit={event => event.preventDefault()}>
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

            <div className="text-(--label-2-medium) flex flex-col gap-1 text-[14px]">
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
               {errors.nationality && <p className="text-xs text-destructive antialiased">{errors.nationality.message}</p>}
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

            <div className="text-(--label-2-medium) flex flex-col gap-1 text-[14px]">
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

            <div className="text-(--label-2-medium) flex flex-col gap-1 text-[14px]">
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
                  onResend={() => void handleRequestCode()}
               />
            )}

            {!isCodeSent && (
               <div className="flex w-95 flex-col justify-center gap-1">
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
                     {identityVerificationTermsAgreements.map(term => (
                        <TermsSubItem
                           key={term.code}
                           id={`term-${term.code}`}
                           label={term.label}
                           checked={Boolean(checkedByCode[term.code])}
                           onChange={checked =>
                              setCheckedByCode(prev => ({
                                 ...prev,
                                 [term.code]: checked === true,
                              }))
                           }
                           showTrigger={term.hasDetail}
                           onTrigger={() => handleOpenDetail(term.code)}
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
                  disabled={!canSendCode || isSendingCode}
                  onClick={() => void handleRequestCode()}
               >
                  인증 번호 전송
               </Button>
            ) : (
               <Button
                  type="button"
                  variant="primary"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={() => void handleSubmit(onSubmit)()}
               >
                  {submitLabel}
               </Button>
            )}
         </form>

         <IdentityVerificationTermsDialog
            open={detailTargetCode !== null}
            detail={termDetail ?? undefined}
            onOpenChange={open => {
               if (!open) {
                  closeDetailDialog();
               }
            }}
            onAgreeAndClose={handleAgreeAndClose}
         />
      </>
   );
};

export default IdentityVerificationForm;
