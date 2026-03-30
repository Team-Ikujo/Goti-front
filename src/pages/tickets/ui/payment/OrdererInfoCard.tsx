// src/pages/tickets/ui/payment/OrdererInfoCard.tsx

import { Input } from '@/shared/ui/input';

import { PaymentCard } from './PaymentCard';

const NAME_MAX_LENGTH = 10;
const PHONE_DIGIT_LENGTH = 11;
const EMAIL_MAX_LENGTH = 35;

const sanitizeName = (value: string) =>
   value.replace(/[^\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318Fa-zA-Z\s]/g, '').slice(0, NAME_MAX_LENGTH);

const sanitizePhone = (value: string) => value.replace(/\D/g, '').slice(0, PHONE_DIGIT_LENGTH);

const formatPhone = (value: string) => {
   const digits = sanitizePhone(value);

   if (digits.length !== PHONE_DIGIT_LENGTH) {
      return digits;
   }

   return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const sanitizeEmail = (value: string) => value.slice(0, EMAIL_MAX_LENGTH);

interface OrdererInfoCardProps {
   name: string;
   phone: string;
   email: string;
   onChangeName: (v: string) => void;
   onChangePhone: (v: string) => void;
   onChangeEmail: (v: string) => void;
}

export function OrdererInfoCard({
   name,
   phone,
   email,
   onChangeName,
   onChangePhone,
   onChangeEmail,
}: OrdererInfoCardProps) {
   return (
      <PaymentCard>
         <h3 className="text-[20px] font-bold leading-[1.5] text-foreground mb-5">주문자 정보 입력</h3>
         <div className="flex flex-col gap-4">
            <Input
               label="이름"
               required
               placeholder="홍길동"
               value={name}
               maxLength={NAME_MAX_LENGTH}
               onChange={e => onChangeName(sanitizeName(e.target.value))}
            />
            <Input
               label="휴대폰 번호"
               required
               placeholder="01012345678"
               value={phone}
               inputMode="numeric"
               maxLength={13}
               onChange={e => onChangePhone(formatPhone(e.target.value))}
            />
            <Input
               label="이메일"
               required
               placeholder="example@email.com"
               value={email}
               maxLength={EMAIL_MAX_LENGTH}
               onChange={e => onChangeEmail(sanitizeEmail(e.target.value))}
            />
         </div>
      </PaymentCard>
   );
}
