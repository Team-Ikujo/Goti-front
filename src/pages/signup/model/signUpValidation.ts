import { z } from 'zod';

export const telecomOptions = [
   { id: 'skt', name: 'SKT' },
   { id: 'kt', name: 'KT' },
   { id: 'lgu', name: 'LG U+' },
   { id: 'skt_mvno', name: 'SKT 알뜰폰' },
   { id: 'kt_mvno', name: 'KT 알뜰폰' },
   { id: 'lgu_mvno', name: 'LG U+ 알뜰폰' },
] as const;

const phoneRegex = /^01[0-9]\d{7,8}$/;
const verificationCodeRegex = /^\d{6}$/;

const isValidBirthDate = (value: string) => {
   if (!/^\d{8}$/.test(value)) return false;

   const year = Number(value.slice(0, 4));
   const month = Number(value.slice(4, 6));
   const day = Number(value.slice(6, 8));

   const date = new Date(year, month - 1, day);
   const today = new Date();
   const isRealDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
   const isPastOrToday = date <= today;
   const isReasonableYear = year >= 1900;

   return isRealDate && isPastOrToday && isReasonableYear;
};

const nameSchema = z.string().trim().min(1, '이름을 입력해주세요').max(30, '이름은 30자 이내로 입력해주세요');

const birthDateSchema = z
   .string()
   .trim()
   .regex(/^\d{8}$/, '생년월일을 입력해주세요')
   .refine(isValidBirthDate, { message: '생년월일을 입력해주세요' });

const phoneSchema = z.string().trim().regex(phoneRegex, "'-'를 제외한 휴대폰 번호를 정확히 입력해주세요");

const requiredTermsSchema = z.boolean().refine(value => value, {
   message: '필수 약관에 동의해주세요',
});

export const sendCodeSchema = z.object({
   name: nameSchema,
   nationality: z.string().min(1, '국적을 선택해주세요'),
   birthDate: birthDateSchema,
   telecom: z.string().min(1, '통신사를 선택해주세요'),
   phone: phoneSchema,
   requiredTermsAgreed: requiredTermsSchema,
});

export const signUpSchema = z.object({
   name: nameSchema,
   nationality: z.string().min(1, '국적을 선택해주세요'),
   birthDate: birthDateSchema,
   gender: z.string().min(1, '성별을 선택해주세요'),
   telecom: z.string().min(1, '통신사를 선택해주세요'),
   phone: phoneSchema,
   verificationCode: z.string().trim().regex(verificationCodeRegex, '인증번호를 입력해주세요'),
   requiredTermsAgreed: requiredTermsSchema,
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type SignUpFieldErrors = Partial<Record<keyof SignUpFormValues, string>>;

export const getFieldErrorsFromZod = (error: z.ZodError): SignUpFieldErrors => {
   const nextErrors: SignUpFieldErrors = {};

   error.issues.forEach(issue => {
      const field = issue.path[0];
      if (typeof field !== 'string') return;
      if (nextErrors[field as keyof SignUpFormValues]) return;
      nextErrors[field as keyof SignUpFormValues] = issue.message;
   });

   return nextErrors;
};

export const normalizeBirthDateInput = (value: string) => value.replace(/\D/g, '').slice(0, 8);
export const normalizePhoneInput = (value: string) => value.replace(/\D/g, '').slice(0, 11);
export const normalizeVerificationCodeInput = (value: string) => value.replace(/\D/g, '').slice(0, 6);
