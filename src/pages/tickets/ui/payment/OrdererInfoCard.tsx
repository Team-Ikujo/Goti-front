// src/pages/tickets/ui/payment/OrdererInfoCard.tsx

import { Input } from '@/shared/ui/input';

import { PaymentCard } from './PaymentCard';

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
               onChange={e => onChangeName(e.target.value.replace(/[^\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318Fa-zA-Z\s]/g, ''))}
            />
            <Input
               label="휴대폰 번호"
               required
               placeholder="01012345678"
               value={phone}
               inputMode="numeric"
               maxLength={11}
               onChange={e => onChangePhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            />
            <Input
               label="이메일"
               required
               placeholder="example@email.com"
               value={email}
               onChange={e => onChangeEmail(e.target.value)}
            />
         </div>
      </PaymentCard>
   );
}
