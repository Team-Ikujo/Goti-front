import { Input } from '@/shared/ui/input';
import type { MemberAddress } from '@/entities/user/api/memberApi';

interface AccountAddressFormCardProps {
   savedAddress: MemberAddress | null;
   zipCode: string;
   address: string;
   addressDetail: string;
   isAddressSaveEnabled: boolean;
   isSavingAddress: boolean;
   onSearchPostcode: () => void;
   onChangeAddressDetail: (value: string) => void;
   onSave: () => void;
}

export function AccountAddressFormCard({
   savedAddress,
   zipCode,
   address,
   addressDetail,
   isAddressSaveEnabled,
   isSavingAddress,
   onSearchPostcode,
   onChangeAddressDetail,
   onSave,
}: AccountAddressFormCardProps) {
   return (
      <div className="bg-background border border-border rounded-[14px] p-6.25 flex flex-col gap-5">
         <p className="text-heading-3-bold text-foreground">주소 수정</p>
         <div className="flex gap-5">
            <p className="text-body-2-medium text-foreground whitespace-nowrap">주소정보</p>
            <div className="flex flex-col gap-7.5 flex-1">
               {savedAddress && (
                  <div className="rounded-lg bg-surface px-4 py-3 text-body-2-regular text-muted-foreground">
                     최근 저장 주소: ({savedAddress.zipCode}) {savedAddress.baseAddress} {savedAddress.detailAddress}
                  </div>
               )}
               <div className="flex flex-col gap-4">
                  <div className="flex items-end gap-2.5">
                     <Input className="flex-1" label="우편번호" required value={zipCode} disabled readOnly />
                     <button
                        type="button"
                        onClick={onSearchPostcode}
                        className="border border-border rounded-lg px-6 py-3 text-body-1-bold text-muted-foreground whitespace-nowrap hover:bg-surface transition-colors mb-px"
                     >
                        우편번호 검색
                     </button>
                  </div>
                  <Input label="주소" required value={address} disabled readOnly />
                  <Input
                     label="상세 주소"
                     required
                     placeholder="상세 주소를 입력하세요"
                     value={addressDetail}
                     onChange={(e) => onChangeAddressDetail(e.target.value)}
                  />
               </div>
               <button
                  type="button"
                  disabled={!isAddressSaveEnabled || isSavingAddress}
                  onClick={onSave}
                  className={`border border-border rounded-lg py-3 text-body-1-bold w-full transition-colors ${
                     isAddressSaveEnabled && !isSavingAddress
                        ? 'text-muted-foreground hover:bg-surface'
                        : 'text-(--text-disabled) cursor-not-allowed'
                  }`}
               >
                  {isSavingAddress ? '저장 중...' : '저장'}
               </button>
            </div>
         </div>
      </div>
   );
}
