// src/pages/tickets/ui/payment/ShippingAddressCard.tsx

import { Input } from '@/shared/ui/input';

import { PaymentCard } from './PaymentCard';

const DAUM_POSTCODE_SCRIPT_URL = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
const DAUM_POSTCODE_SCRIPT_ID = 'daum-postcode-script';

interface ShippingAddressCardProps {
   zipCode: string;
   address: string;
   addressDetail: string;
   onZipResult: (zipCode: string, address: string) => void;
   onChangeAddressDetail: (v: string) => void;
}

/** 다음 우편번호 스크립트를 동적으로 로드하고 팝업을 엽니다. */
function loadDaumPostcodeAndOpen(onComplete: (zipCode: string, address: string) => void) {
   const open = () => {
      const POPUP_W = 500;
      const POPUP_H = 600;
      const left = window.screenX + Math.round((window.outerWidth - POPUP_W) / 2);
      const top = window.screenY + Math.round((window.outerHeight - POPUP_H) / 2);

      new window.daum!.Postcode({
         oncomplete: (data) => {
            // 도로명 주소가 있으면 우선 사용, 없으면 지번 주소
            const selectedAddress = data.roadAddress || data.jibunAddress;
            onComplete(data.zonecode, selectedAddress);
         },
         width: POPUP_W,
         height: POPUP_H,
      }).open({ left, top });
   };

   if (window.daum?.Postcode) {
      open();
      return;
   }

   // 이미 스크립트 태그가 삽입된 경우 로드 완료를 기다림
   const existing = document.getElementById(DAUM_POSTCODE_SCRIPT_ID);
   if (existing) {
      existing.addEventListener('load', open, { once: true });
      return;
   }

   const script = document.createElement('script');
   script.id = DAUM_POSTCODE_SCRIPT_ID;
   script.src = DAUM_POSTCODE_SCRIPT_URL;
   script.onload = open;
   script.onerror = () => console.error('다음 우편번호 스크립트 로드에 실패했습니다.');
   document.head.appendChild(script);
}

export function ShippingAddressCard({
   zipCode,
   address,
   addressDetail,
   onZipResult,
   onChangeAddressDetail,
}: ShippingAddressCardProps) {
   const handleSearchZip = () => {
      loadDaumPostcodeAndOpen(onZipResult);
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
