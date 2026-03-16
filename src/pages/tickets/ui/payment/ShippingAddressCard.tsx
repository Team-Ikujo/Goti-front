// src/pages/tickets/ui/payment/ShippingAddressCard.tsx

import { Input } from '@/shared/ui/input';

import { PaymentCard } from './PaymentCard';

interface ShippingAddressCardProps {
   zipCode: string;
   address: string;
   addressDetail: string;
   /** 우편번호 검색 완료 후 결과를 부모에 전달 (TODO: 다음 우편번호 API 연결) */
   onZipResult: (zipCode: string, address: string) => void;
   onChangeAddressDetail: (v: string) => void;
}

export function ShippingAddressCard({
   zipCode,
   address,
   addressDetail,
   onZipResult,
   onChangeAddressDetail,
}: ShippingAddressCardProps) {
   const handleSearchZip = () => {
      // TODO: 다음 우편번호 API 연결
      // window.daum?.Postcode({ oncomplete: (data) => onZipResult(data.zonecode, data.roadAddress) }).open();
      onZipResult('', '');
   };

   return (
      <PaymentCard>
         <h3 className="text-[20px] font-bold leading-[1.5] text-foreground mb-5">배송지 정보 입력</h3>
         <div className="flex flex-col gap-4">
            {/* 우편번호 + 검색 버튼 */}
            <div className="flex flex-col gap-1">
               <label className="text-[14px] font-bold leading-[1.45] text-muted-foreground">
                  우편번호<span className="text-primary">*</span>
               </label>
               <div className="flex items-end gap-2.5">
                  <input
                     readOnly
                     value={zipCode}
                     placeholder="12345"
                     className="flex-1 h-12 px-4 rounded-lg border border-border bg-(--fill-disabled) text-[16px] text-disabled-foreground outline-none"
                  />
                  <button
                     type="button"
                     onClick={handleSearchZip}
                     className="h-12 px-6 border border-border rounded-lg text-[16px] font-bold leading-[1.5] text-muted-foreground hover:bg-(--fill-hover) transition-colors whitespace-nowrap"
                  >
                     우편번호 검색
                  </button>
               </div>
            </div>

            {/* 주소 (검색 후 자동 입력) */}
            <div className="flex flex-col gap-1">
               <label className="text-[14px] font-bold leading-[1.45] text-muted-foreground">
                  주소<span className="text-primary">*</span>
               </label>
               <input
                  readOnly
                  value={address}
                  placeholder="서울특별시 강남구 테헤란로 123"
                  className="h-12 px-4 rounded-lg border border-border bg-(--fill-disabled) text-[16px] text-disabled-foreground outline-none w-full"
               />
            </div>

            {/* 상세 주소 */}
            <Input
               label="상세 주소"
               required
               placeholder="101호"
               value={addressDetail}
               onChange={e => onChangeAddressDetail(e.target.value)}
            />
         </div>
      </PaymentCard>
   );
}
