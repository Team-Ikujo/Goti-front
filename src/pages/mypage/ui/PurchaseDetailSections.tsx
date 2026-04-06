import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import StatusBadge, { type BadgeVariant } from './StatusBadge';
import TicketItem from './TicketItem';
import {
   formatDateTime,
   formatPrice,
   type PurchaseSeatItem,
} from '../model/purchaseDetail';

function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
   return (
      <div className={`border border-[#e9ebee] rounded-2xl p-6.25 flex flex-col gap-6 ${className}`}>{children}</div>
   );
}

function InfoRow({ label, value }: { label: string; value: string }) {
   return (
      <div className="flex items-start justify-between text-body-1-regular">
         <span className="flex-1 text-[#646f7c] leading-normal">{label}</span>
         <span className="shrink-0 text-[#374553] text-right leading-normal">{value}</span>
      </div>
   );
}

function BulletItem({ text }: { text: string }) {
   return (
      <div className="flex gap-1 items-start">
         <span className="shrink-0">•</span>
         <span className="flex-1">{text}</span>
      </div>
   );
}

export function PurchaseGameInfoSection({
   statusLabel,
   statusVariant,
   teams,
   datetime,
   venue,
}: {
   statusLabel: string;
   statusVariant?: BadgeVariant;
   teams: string;
   datetime: string;
   venue?: string;
}) {
   return (
      <SectionCard>
         <StatusBadge label={statusLabel} variant={statusVariant} />
         <div className="flex flex-col gap-4">
            <p className="text-[32px] font-bold text-[#161d24] tracking-[-0.032px] leading-[1.45]">{teams}</p>
            <div className="flex flex-col gap-1 text-[18px] font-medium text-[#374553]">
               <p className="leading-[1.55]">{formatDateTime(datetime)}</p>
               {venue && <p className="leading-[1.55]">{venue}</p>}
            </div>
         </div>
      </SectionCard>
   );
}

export function PurchaseReservationInfoSection({
   orderId,
   issuedAt,
   orderer,
   cancelDeadline,
}: {
   orderId: string;
   issuedAt?: string;
   orderer: string;
   cancelDeadline?: string;
}) {
   return (
      <SectionCard>
         <h2 className="text-[20px] font-bold text-[#161d24] leading-normal">예약 정보</h2>
         <div className="flex flex-col gap-3">
            <InfoRow label="예약번호" value={orderId} />
            <InfoRow label="예매일시" value={issuedAt ? formatDateTime(issuedAt) : '-'} />
            <InfoRow label="예매자" value={orderer} />
            <InfoRow label="취소 가능 기한" value={cancelDeadline ? `${formatDateTime(cancelDeadline)} 까지` : '-'} />
         </div>
      </SectionCard>
   );
}

export function PurchaseSeatInfoSection({ seatTickets }: { seatTickets: PurchaseSeatItem[] }) {
   return (
      <SectionCard className="gap-8">
         <h2 className="text-[20px] font-bold text-[#161d24] leading-normal">좌석 정보</h2>
         <div className="flex flex-col gap-6">
            {seatTickets.map((ticket, index) => (
               <div key={ticket.ticketId}>
                  {index > 0 && <div className="h-px bg-[#e9ebee] mb-6" />}
                  <TicketItem
                     orderId={ticket.orderId}
                     section={ticket.section}
                     seatDetail={ticket.seatDetail}
                     status={ticket.status}
                     price={ticket.price}
                  />
               </div>
            ))}
         </div>
      </SectionCard>
   );
}

export function PurchaseTicketDeliverySection({ onOpenQr }: { onOpenQr: () => void }) {
   return (
      <SectionCard>
         <h2 className="text-[20px] font-bold text-[#161d24] leading-normal">티켓 수령 방법</h2>
         <InfoRow label="수령 방법" value="모바일 QR" />
         <Button variant="secondary" className="w-full py-3" onClick={onOpenQr}>
            모바일 QR 확인
         </Button>
      </SectionCard>
   );
}

export function PurchasePaymentInfoSection({
   isLoading,
   isError,
   totalQuantity,
   totalTicketPrice,
   serviceFee,
   totalPaid,
   paymentMethodDisplay,
   paidAt,
}: {
   isLoading: boolean;
   isError: boolean;
   totalQuantity: number;
   totalTicketPrice: number;
   serviceFee: number;
   totalPaid: number;
   paymentMethodDisplay?: string;
   paidAt?: string;
}) {
   return (
      <SectionCard>
         <div className="flex items-start justify-between text-[20px] font-bold">
            <span className="text-[#161d24] leading-normal">결제 정보</span>
            <span className="text-primary leading-normal">결제 완료</span>
         </div>
         {isLoading ? (
            <div className="rounded-xl bg-[#f7f8f9] px-5 py-6 text-center text-[14px] text-[#646f7c]">
               결제 정보를 불러오는 중입니다.
            </div>
         ) : isError ? (
            <div className="rounded-xl bg-[#f7f8f9] px-5 py-6 text-center text-[14px] text-[#646f7c]">
               결제 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
            </div>
         ) : (
            <>
               <div className="bg-[#f7f8f9] rounded-xl p-5 flex flex-col gap-3">
                  <InfoRow label={`티켓 금액 (${totalQuantity}매)`} value={formatPrice(totalTicketPrice)} />
                  <InfoRow label="수수료" value={formatPrice(serviceFee)} />
                  <div className="flex items-center justify-between font-bold">
                     <span className="text-[16px] text-[#374553] leading-normal">총 결제 금액</span>
                     <span className="text-[20px] text-primary leading-normal">{formatPrice(totalPaid)}</span>
                  </div>
               </div>
               <div className="flex flex-col gap-3">
                  <InfoRow label="결제 수단" value={paymentMethodDisplay ?? '-'} />
                  <InfoRow label="결제 일시" value={paidAt ? formatDateTime(paidAt) : '-'} />
               </div>
            </>
         )}
      </SectionCard>
   );
}

export function PurchaseRefundInfoSection({
   isLoading,
   isError,
   totalQuantity,
   totalTicketPrice,
   serviceFee,
   totalRefund,
   paymentMethodDisplay,
   paidAt,
}: {
   isLoading: boolean;
   isError: boolean;
   totalQuantity: number;
   totalTicketPrice: number;
   serviceFee: number;
   totalRefund: number;
   paymentMethodDisplay?: string;
   paidAt?: string;
}) {
   return (
      <SectionCard>
         <div className="flex items-start justify-between text-[20px] font-bold">
            <span className="text-[#161d24] leading-normal">취소/환불 정보</span>
            <span className="text-destructive leading-normal">취소/환불 완료</span>
         </div>
         <div className="bg-[#f7f8f9] rounded-xl p-5 flex flex-col gap-3">
            <InfoRow label={`티켓 금액 (${totalQuantity}매)`} value={formatPrice(totalTicketPrice)} />
            <InfoRow label="수수료" value={`-${formatPrice(serviceFee)}`} />
            <div className="flex items-center justify-between font-bold">
               <span className="text-[16px] text-[#374553] leading-normal">환불 금액</span>
               <span className="text-[20px] text-destructive leading-normal">{formatPrice(totalRefund)}</span>
            </div>
         </div>
         {isLoading ? (
            <div className="rounded-xl bg-[#f7f8f9] px-5 py-6 text-center text-[14px] text-[#646f7c]">
               환불 정보를 불러오는 중입니다.
            </div>
         ) : isError ? (
            <div className="rounded-xl bg-[#f7f8f9] px-5 py-6 text-center text-[14px] text-[#646f7c]">
               환불 수단 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
            </div>
         ) : (
            <div className="flex flex-col gap-3">
               <InfoRow label="환불 수단" value={paymentMethodDisplay ?? '정보 없음'} />
               <InfoRow label="취소 일시" value={paidAt ? formatDateTime(paidAt) : '정보 없음'} />
            </div>
         )}
         <div className="bg-[#f7f8f9] rounded-xl p-5">
            <div className="flex flex-col gap-1 text-[13px] font-medium text-[#646f7c] leading-normal">
               <BulletItem text="취소/환불은 영업일 기준 1~3일 이내 처리될 예정입니다." />
               <BulletItem text="문의사항은 고객센터로 문의해주세요." />
            </div>
         </div>
      </SectionCard>
   );
}

export function PurchaseActionButtons({
   canCancel,
   canSell,
   onCancel,
   onSell,
}: {
   canCancel: boolean;
   canSell: boolean;
   onCancel: () => void;
   onSell: () => void;
}) {
   if (!canCancel && !canSell) {
      return null;
   }

   return (
      <div className="flex gap-3">
         {canCancel && (
            <Button variant="tertiary" className="flex-1 py-3" onClick={onCancel}>
               예매 취소하기
            </Button>
         )}
         {canSell && (
            <Button variant="secondary" className="flex-1 py-3" onClick={onSell}>
               판매 등록하기
            </Button>
         )}
      </div>
   );
}

export function PurchaseEntryGuideSection() {
   return (
      <div className="bg-[#f4f7fe] rounded-[14px] p-6 flex flex-col gap-2">
         <h4 className="text-[18px] font-bold text-primary leading-[1.55]">입장 안내</h4>
         <div className="flex flex-col gap-1 text-[14px] text-[#374553] leading-normal">
            <BulletItem text="경기 시작 2시간 전부터 입장 가능합니다" />
            <BulletItem text="모바일 티켓 QR코드를 게이트에서 제시해주세요" />
            <BulletItem text="신분증을 함께 지참해주세요" />
         </div>
      </div>
   );
}

export function PurchaseNoticeSection() {
   return (
      <div className="bg-[#f7f8f9] rounded-[14px] p-6 flex flex-col gap-6">
         <div className="flex items-center gap-1">
            <AlertCircle size={20} className="text-[#161d24] shrink-0" />
            <h4 className="text-[18px] font-bold text-[#161d24] leading-[1.55]">유의사항</h4>
         </div>
         <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
               <p className="text-[16px] font-bold text-[#374553] leading-normal">취소/환불 안내</p>
               <div className="flex flex-col gap-1 text-[14px] text-[#374553] leading-normal">
                  <BulletItem text="예매 당일 취소 시 전액 환불됩니다. (예매 수수료 포함)" />
                  <BulletItem text="예매 익일 ~ 경기 시작 4시간 전까지 취소 시 예매 수수료와 취소 수수료가 부과됩니다." />
                  <BulletItem text="경기 시작 4시간 전인 예매 취소 마감 기간 이후 취소 및 환불이 불가능합니다." />
                  <BulletItem text="리셀로 구매한 티켓은 취소 및 환불이 불가능합니다." />
                  <BulletItem text="취소/환불 금액은 은행 영업일 기준 1~3일 내에 지정된 계좌로 입금됩니다." />
                  <BulletItem text="환불 규정에 따라 환불 처리가 됩니다." />
               </div>
            </div>
            <div className="flex flex-col gap-2">
               <p className="text-[16px] font-bold text-[#374553] leading-normal">티켓 리셀 안내</p>
               <div className="flex flex-col gap-1 text-[14px] text-[#374553] leading-normal">
                  <BulletItem text="안전한 거래를 위해 모바일 티켓만 리셀 등록이 가능합니다." />
                  <BulletItem text="구매하신 티켓은 예매 시작 이후 2시간이 된 시점부터 경기 시작 이후 1시간까지 리셀 마켓에 등록하실 수 있습니다." />
                  <BulletItem text="리셀 시 별도의 취소 수수료는 없으며, 거래 완료 시 판매 금액의 5% 중개 수수료가 적용됩니다." />
               </div>
            </div>
         </div>
      </div>
   );
}
