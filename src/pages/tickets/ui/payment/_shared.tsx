// src/pages/tickets/ui/payment/_shared.tsx

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Building2, ChevronDown, ChevronLeft, ChevronRight, CreditCard, Smartphone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';

// ── 타입 ─────────────────────────────────────────────────────────────
export type PaymentMethod = 'card' | 'kakao' | 'naver' | 'toss' | 'bank';

export interface OrderInfo {
   matchTitle: string;
   dateTime: string;
   quantity: number;
   seats: string[];
   deliveryLabel: string;
   paymentLabel: string;
}

// ── 예매 타이머 훅 ────────────────────────────────────────────────────
function useBookingTimer(initialSeconds = 599) {
   const [remaining, setRemaining] = useState(initialSeconds);
   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

   useEffect(() => {
      timerRef.current = setInterval(() => {
         setRemaining(prev => {
            if (prev <= 1) {
               clearInterval(timerRef.current!);
               return 0;
            }
            return prev - 1;
         });
      }, 1000);
      return () => {
         if (timerRef.current) clearInterval(timerRef.current);
      };
   }, []);

   const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
   const ss = String(remaining % 60).padStart(2, '0');
   return `${mm}:${ss}`;
}

// ── 결제 전용 헤더 ───────────────────────────────────────────────────
interface PaymentHeaderProps {
   matchTitle: string;
   venue: string;
   dateTime: string;
}

export function PaymentHeader({ matchTitle, venue, dateTime }: PaymentHeaderProps) {
   const navigate = useNavigate();
   const timeStr = useBookingTimer();

   return (
      <header className="bg-background flex flex-col w-full">
         {/* 1행: 로고 / 예매 시간 / 유저 아이콘 */}
         <div className="flex items-center justify-between px-8 py-4 border-b border-border-light">
            <Link to="/" className="text-[21px] font-bold tracking-[-0.5px] text-foreground">
               GoTi
            </Link>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 text-[18px] leading-[1.55]">
                  <span className="font-medium text-(--text-secondary)">예매 시간</span>
                  <span className="font-bold text-primary">{timeStr}</span>
                  <button type="button" className="size-6 flex items-center justify-center" aria-label="예매 시간 안내">
                     <AlertCircle className="size-5 text-(--text-tertiary)" />
                  </button>
               </div>
               <button type="button" className="size-6 flex items-center justify-center" aria-label="마이페이지">
                  <img src="/Icon/Line/Mypage.svg" alt="마이페이지" className="size-6" />
               </button>
            </div>
         </div>

         {/* 2행: 뒤로가기 / 경기 정보 / 단계 표시 */}
         <div className="flex items-center h-[72px] pl-7 pr-8 gap-6 border-b border-border-light">
            <div className="flex flex-1 items-center gap-3 min-w-0">
               <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="p-1 flex items-center justify-center shrink-0"
                  aria-label="뒤로가기"
               >
                  <ChevronLeft className="size-6 text-foreground" />
               </button>
               <div className="flex items-center gap-4 min-w-0 overflow-hidden">
                  <span className="text-[22px] font-bold leading-[1.55] text-foreground whitespace-nowrap shrink-0">
                     {matchTitle}
                  </span>
                  <div className="flex items-center gap-2 text-[18px] font-medium leading-[1.55] text-(--text-secondary) min-w-0">
                     <span className="whitespace-nowrap">{venue}</span>
                     <span>∙</span>
                     <span className="whitespace-nowrap">{dateTime}</span>
                  </div>
               </div>
            </div>
            {/* 단계 표시 */}
            <div className="flex items-center gap-4 shrink-0">
               <span className="text-[14px] font-medium leading-[1.45] text-(--text-disabled)">구역 선택</span>
               <ChevronRight className="size-4 text-(--text-disabled)" />
               <span className="text-[14px] font-medium leading-[1.45] text-(--text-disabled)">좌석선택</span>
               <ChevronRight className="size-4 text-(--text-disabled)" />
               <span className="text-[14px] font-semibold leading-[1.45] text-(--text-secondary)">결제</span>
            </div>
         </div>
      </header>
   );
}

// ── 카드 래퍼 ────────────────────────────────────────────────────────
export function PaymentCard({ className, children }: { className?: string; children: React.ReactNode }) {
   return (
      <div className={cn('bg-background border border-border rounded-[14px] p-[25px]', className)}>
         {children}
      </div>
   );
}

// ── 라디오 옵션 카드 (테두리형) ──────────────────────────────────────
interface RadioOptionCardProps {
   selected: boolean;
   onSelect: () => void;
   label: string;
   description: string;
   extra?: string;
   disabled?: boolean;
}

export function RadioOptionCard({ selected, onSelect, label, description, extra, disabled }: RadioOptionCardProps) {
   return (
      <button
         type="button"
         onClick={onSelect}
         disabled={disabled}
         className={cn(
            'flex items-center gap-4 w-full px-[17px] py-[11px] rounded-[10px] border transition-colors text-left',
            selected ? 'border-primary' : 'border-border',
            disabled && 'cursor-default',
         )}
      >
         <div
            className={cn(
               'size-4 rounded-full shrink-0 flex items-center justify-center',
               selected ? 'bg-primary' : 'border-[1.5px] border-border',
            )}
         >
            {selected && <span className="size-[7px] rounded-full bg-white block" />}
         </div>
         <div className="flex-1 flex flex-col gap-1">
            <span className="text-[16px] font-bold leading-[1.5] text-foreground">{label}</span>
            <span className="text-[16px] font-medium leading-[1.5] text-(--text-secondary)">{description}</span>
         </div>
         {extra && <span className="text-[16px] font-medium leading-[1.5] text-foreground shrink-0">{extra}</span>}
      </button>
   );
}

// ── 주문자 정보 입력 카드 ─────────────────────────────────────────────
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
               onChange={e => onChangeName(e.target.value)}
            />
            <Input
               label="휴대폰 번호"
               required
               placeholder="010-1234-5678"
               value={phone}
               onChange={e => onChangePhone(e.target.value)}
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

// ── 할인 선택 카드 (형식용, 기능 없음) ──────────────────────────────
export function DiscountCard() {
   return (
      <div className="bg-background border border-border rounded-[14px] p-[25px] flex items-center justify-between">
         <span className="text-[20px] font-bold leading-[1.5] text-foreground">할인 선택</span>
         <ChevronDown className="size-6 text-foreground" />
      </div>
   );
}

// ── 티켓 리셀 안내 (파란 배너) ──────────────────────────────────────
export function ResellInfoCard() {
   return (
      <div className="bg-(--fill-hoveraccent) border border-(--border-accent) rounded-[14px] p-[25px]">
         <div className="flex gap-3 items-start">
            <AlertCircle className="size-5 text-primary mt-[3px] shrink-0" />
            <div className="flex flex-col gap-2">
               <span className="text-[18px] font-bold leading-[1.55] text-[#0054d1]">티켓 리셀 안내</span>
               <div className="flex flex-col gap-1 text-[16px] font-medium leading-[1.5] text-[#0054d1]">
                  <p>• 안전한 거래를 위해 모바일 티켓만 리셀 등록이 가능합니다.</p>
                  <p>• 구매하신 티켓은 경기 전날까지 리셀 마켓에 등록하실 수 있습니다.</p>
                  <p>• 리셀 시 취소 수수료 없이 판매 가격의 95%를 받으실 수 있습니다.</p>
               </div>
            </div>
         </div>
      </div>
   );
}

// ── 약관 동의 카드 ───────────────────────────────────────────────────
interface TermsCardProps {
   agreedPrivacy: boolean;
   agreedPolicy: boolean;
   onChangePrivacy: (v: boolean) => void;
   onChangePolicy: (v: boolean) => void;
}

export function TermsCard({ agreedPrivacy, agreedPolicy, onChangePrivacy, onChangePolicy }: TermsCardProps) {
   return (
      <PaymentCard>
         <h3 className="text-[20px] font-bold leading-[1.5] text-foreground mb-5">약관 동의</h3>
         <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
               <Checkbox
                  checked={agreedPrivacy}
                  onCheckedChange={v => onChangePrivacy(!!v)}
               />
               <span className="text-[14px] font-semibold text-foreground">[필수]</span>
               <span className="text-[14px] font-medium text-foreground underline">개인정보 수집 및 이용 동의</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
               <Checkbox
                  checked={agreedPolicy}
                  onCheckedChange={v => onChangePolicy(!!v)}
               />
               <span className="text-[14px] font-semibold text-foreground">[필수]</span>
               <span className="text-[14px] font-medium text-foreground underline">취소/환불 및 리셀 정책 동의</span>
            </label>
         </div>
      </PaymentCard>
   );
}

// ── 결제 방법 카드 (오른쪽 컬럼) ────────────────────────────────────
interface PayMethodOptionProps {
   selected: boolean;
   onSelect: () => void;
   icon: React.ReactNode;
   label: string;
   description: string;
}

function PayMethodOption({ selected, onSelect, icon, label, description }: PayMethodOptionProps) {
   return (
      <button
         type="button"
         onClick={onSelect}
         className={cn(
            'flex items-center gap-3 w-full px-[17px] py-[9px] rounded-[10px] border transition-colors text-left',
            selected ? 'border-primary' : 'border-border',
         )}
      >
         <div
            className={cn(
               'size-4 rounded-full shrink-0 flex items-center justify-center',
               selected ? 'bg-primary' : 'border-[1.5px] border-border',
            )}
         >
            {selected && <span className="size-[7px] rounded-full bg-white block" />}
         </div>
         <span className="size-5 shrink-0 text-(--text-secondary) flex items-center justify-center">{icon}</span>
         <div className="flex flex-col gap-0.5">
            <span className="text-[16px] font-bold leading-[1.5] text-foreground">{label}</span>
            <span className="text-[16px] font-medium leading-[1.5] text-(--text-secondary)">{description}</span>
         </div>
      </button>
   );
}

const PAYMENT_OPTIONS: { id: PaymentMethod; icon: React.ReactNode; label: string; description: string }[] = [
   { id: 'card', icon: <CreditCard className="size-5" />, label: '신용/체크카드', description: '모든 카드사 사용 가능' },
   { id: 'kakao', icon: <Smartphone className="size-5" />, label: '카카오페이', description: '간편 결제' },
   { id: 'naver', icon: <Smartphone className="size-5" />, label: '네이버페이', description: '간편 결제' },
   { id: 'toss', icon: <Smartphone className="size-5" />, label: '토스페이', description: '간편 결제' },
   { id: 'bank', icon: <Building2 className="size-5" />, label: '무통장 입금', description: '가상계좌 발급' },
];

interface PaymentMethodCardProps {
   selected: PaymentMethod;
   onSelect: (method: PaymentMethod) => void;
}

export function PaymentMethodCard({ selected, onSelect }: PaymentMethodCardProps) {
   return (
      <PaymentCard>
         <h3 className="text-[20px] font-bold leading-[1.5] text-foreground mb-5">결제 방법</h3>
         <div className="flex flex-col gap-3">
            {PAYMENT_OPTIONS.map(opt => (
               <PayMethodOption
                  key={opt.id}
                  selected={selected === opt.id}
                  onSelect={() => onSelect(opt.id)}
                  icon={opt.icon}
                  label={opt.label}
                  description={opt.description}
               />
            ))}
         </div>
      </PaymentCard>
   );
}

// ── 결제 안내 카드 ───────────────────────────────────────────────────
export function PaymentGuideCard() {
   return (
      <div className="bg-(--fill-hover) border border-border rounded-[14px] p-[25px] flex flex-col gap-2">
         <h4 className="text-[18px] font-bold leading-[1.55] text-foreground">결제 안내</h4>
         <div className="flex flex-col gap-1 text-[16px] font-medium leading-[1.5] text-foreground">
            <p>• 결제 후 즉시 예매가 완료됩니다</p>
            <p>• 모바일 티켓은 결제 후 바로 발급됩니다</p>
            <p>• 결제 실패 시 자동으로 주문이 취소됩니다</p>
         </div>
      </div>
   );
}

// ── 주문 정보 확인 카드 ──────────────────────────────────────────────
export function OrderSummaryCard({ orderInfo }: { orderInfo: OrderInfo }) {
   return (
      <PaymentCard>
         <h3 className="text-[20px] font-bold leading-[1.5] text-foreground mb-10">주문 정보 확인</h3>
         <div className="flex flex-col gap-3">
            {/* 경기 */}
            <div className="flex flex-col gap-0.5">
               <span className="text-[14px] font-bold leading-[1.5] text-(--text-secondary)">경기</span>
               <span className="text-[20px] font-bold leading-[1.5] text-foreground">{orderInfo.matchTitle}</span>
               <span className="text-[18px] font-semibold leading-[1.55] text-(--text-tertiary)">{orderInfo.dateTime}</span>
            </div>
            {/* 수량 */}
            <div className="border-t border-border pt-3.5 flex flex-col gap-0.5">
               <span className="text-[14px] font-bold leading-[1.5] text-(--text-secondary)">수량</span>
               <span className="text-[18px] font-semibold leading-[1.55] text-(--text-tertiary)">{orderInfo.quantity}매</span>
            </div>
            {/* 좌석 */}
            <div className="border-t border-border pt-3.5 flex flex-col gap-0.5">
               <span className="text-[14px] font-bold leading-[1.5] text-(--text-secondary)">좌석</span>
               {orderInfo.seats.map((seat, i) => (
                  <span key={i} className="text-[18px] font-semibold leading-[1.55] text-(--text-tertiary)">
                     {seat}
                  </span>
               ))}
            </div>
            {/* 수령 방식 */}
            <div className="border-t border-border pt-3.5 flex flex-col gap-1">
               <span className="text-[14px] font-bold leading-[1.5] text-(--text-secondary)">수령 방식</span>
               <span className="text-[18px] font-semibold leading-[1.55] text-(--text-tertiary)">{orderInfo.deliveryLabel}</span>
            </div>
            {/* 결제 방식 */}
            <div className="border-t border-border pt-3.5 flex flex-col gap-1">
               <span className="text-[14px] font-bold leading-[1.5] text-(--text-secondary)">결제 방식</span>
               <span className="text-[18px] font-semibold leading-[1.55] text-(--text-tertiary)">{orderInfo.paymentLabel}</span>
            </div>
         </div>
      </PaymentCard>
   );
}

// ── 결제 금액 카드 ───────────────────────────────────────────────────
interface Discount {
   label: string;
   amount: number;
}

interface PaymentAmountCardProps {
   ticketPrice: number;
   shippingFee: number;
   discounts: Discount[];
   fee: number;
}

function formatKRW(n: number) {
   return `${n.toLocaleString('ko-KR')}원`;
}

export function PaymentAmountCard({ ticketPrice, shippingFee, discounts, fee }: PaymentAmountCardProps) {
   const totalOrder = ticketPrice + shippingFee;
   const totalDiscount = discounts.reduce((acc, d) => acc + d.amount, 0);
   const totalPayment = totalOrder - totalDiscount + fee;

   return (
      <PaymentCard>
         <h3 className="text-[20px] font-bold leading-[1.5] text-foreground mb-10">결제 금액</h3>
         <div className="flex flex-col gap-[18px]">
            {/* 총 주문 금액 */}
            <div className="flex flex-col gap-2">
               <div className="flex justify-between items-start text-[18px] font-bold leading-[1.55] text-foreground">
                  <span>총 주문 금액</span>
                  <span>{formatKRW(totalOrder)}</span>
               </div>
               <div className="flex justify-between items-start text-[16px] font-medium leading-[1.5]">
                  <span className="text-(--text-secondary)">ㄴ 티켓 금액</span>
                  <span className="text-foreground">{formatKRW(ticketPrice)}</span>
               </div>
               <div className="flex justify-between items-start text-[16px] font-medium leading-[1.5]">
                  <span className="text-(--text-secondary)">ㄴ 배송비</span>
                  <span className="text-foreground">{formatKRW(shippingFee)}</span>
               </div>
            </div>
            {/* 총 할인 금액 */}
            <div className="flex flex-col gap-2">
               <div className="flex justify-between items-start text-[18px] font-bold leading-[1.55]">
                  <span className="text-foreground">총 할인 금액</span>
                  <span className="text-destructive">-{formatKRW(totalDiscount)}</span>
               </div>
               {discounts.map((d, i) => (
                  <div key={i} className="flex justify-between items-start text-[16px] font-medium leading-[1.5]">
                     <span className="text-(--text-secondary)">ㄴ {d.label}</span>
                     <span className="text-foreground">-{formatKRW(d.amount)}</span>
                  </div>
               ))}
            </div>
            {/* 수수료 */}
            <div className="flex justify-between items-start text-[18px] font-bold leading-[1.55] text-foreground">
               <span>수수료</span>
               <span>{formatKRW(fee)}</span>
            </div>
            {/* 총 결제 금액 */}
            <div className="border-t border-border pt-[19px] flex justify-between items-end">
               <span className="text-[18px] font-bold leading-[1.55] text-foreground">총 결제 금액</span>
               <span className="text-[24px] font-bold leading-[1.5] text-destructive">{formatKRW(totalPayment)}</span>
            </div>
         </div>
      </PaymentCard>
   );
}

// ── 배송지 정보 입력 카드 (배송 수령 선택 시) ────────────────────────
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

// ── 현금영수증 카드 (무통장 입금 선택 시) ──────────────────────────
export type CashReceiptType = 'income' | 'expense' | 'none';
export type CashReceiptNumType = 'phone' | 'card';

const CASH_NUM_OPTIONS: { value: CashReceiptNumType; label: string }[] = [
   { value: 'phone', label: '휴대폰 번호' },
   { value: 'card', label: '현금영수증 카드번호' },
];

/** 현금영수증 번호 유형 커스텀 드롭다운 */
function NumTypeSelect({
   value,
   onChange,
}: {
   value: CashReceiptNumType;
   onChange: (v: CashReceiptNumType) => void;
}) {
   const [open, setOpen] = useState(false);
   const ref = useRef<HTMLDivElement>(null);
   const selected = CASH_NUM_OPTIONS.find(o => o.value === value) ?? CASH_NUM_OPTIONS[0];

   // 외부 클릭 시 닫기
   useEffect(() => {
      const handleClick = (e: MouseEvent) => {
         if (ref.current && !ref.current.contains(e.target as Node)) {
            setOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
   }, []);

   return (
      <div ref={ref} className="relative flex-1">
         {/* 트리거 */}
         <button
            type="button"
            onClick={() => setOpen(prev => !prev)}
            className="w-full h-9 px-[13px] py-px flex items-center justify-between border border-border-light rounded-[8px] bg-background"
         >
            <span className="text-[14px] font-medium leading-[1.5] text-foreground">{selected.label}</span>
            <ChevronDown className={cn('size-5 text-foreground transition-transform', open && 'rotate-180')} />
         </button>

         {/* 드롭다운 목록 */}
         {open && (
            <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-10 bg-background border border-border-light rounded-[8px] p-[5px]">
               {CASH_NUM_OPTIONS.map(opt => (
                  <button
                     key={opt.value}
                     type="button"
                     onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                     }}
                     className={cn(
                        'w-full flex items-center px-[6px] py-[6px] rounded-[6px] text-[14px] leading-[1.5]',
                        opt.value === value
                           ? 'bg-(--fill-hover) font-medium text-(--text-secondary)'
                           : 'font-normal text-(--text-tertiary)',
                     )}
                  >
                     {opt.label}
                  </button>
               ))}
            </div>
         )}
      </div>
   );
}

interface CashReceiptCardProps {
   receiptType: CashReceiptType;
   onChangeReceiptType: (v: CashReceiptType) => void;
   numType: CashReceiptNumType;
   onChangeNumType: (v: CashReceiptNumType) => void;
   num: string;
   onChangeNum: (v: string) => void;
   saveInfo: boolean;
   onChangeSaveInfo: (v: boolean) => void;
}

/** 작은 인라인 라디오 (카드형이 아닌 텍스트 옆 버튼) */
function InlineRadio({ selected }: { selected: boolean }) {
   return (
      <div
         className={cn(
            'size-[18px] rounded-full shrink-0 flex items-center justify-center',
            selected ? 'bg-primary' : 'border-[1.5px] border-border',
         )}
      >
         {selected && <span className="size-[7px] rounded-full bg-white block" />}
      </div>
   );
}

export function CashReceiptCard({
   receiptType,
   onChangeReceiptType,
   numType,
   onChangeNumType,
   num,
   onChangeNum,
   saveInfo,
   onChangeSaveInfo,
}: CashReceiptCardProps) {
   return (
      <PaymentCard>
         <h3 className="text-[20px] font-bold leading-[1.5] text-foreground mb-10">현금영수증</h3>
         <div className="flex flex-col gap-[18px]">
            {/* 소득공제용 / 지출증빙용 / 미발행 */}
            <div className="flex items-center justify-between">
               {(
                  [
                     { value: 'income', label: '소득공제용' },
                     { value: 'expense', label: '지출증빙용' },
                     { value: 'none', label: '미발행' },
                  ] as { value: CashReceiptType; label: string }[]
               ).map(opt => (
                  <button
                     key={opt.value}
                     type="button"
                     onClick={() => onChangeReceiptType(opt.value)}
                     className="flex items-center gap-1"
                  >
                     <InlineRadio selected={receiptType === opt.value} />
                     <span className="text-[16px] font-medium leading-[1.5] text-muted-foreground">{opt.label}</span>
                  </button>
               ))}
            </div>

            {/* 번호 유형 선택 + 번호 입력 (미발행 시 숨김) */}
            {receiptType !== 'none' && (
               <div className="flex items-start gap-2.5">
                  {/* 번호 유형 커스텀 드롭다운 */}
                  <NumTypeSelect value={numType} onChange={onChangeNumType} />

                  {/* 번호 입력 */}
                  <input
                     type="text"
                     value={num}
                     onChange={e => onChangeNum(e.target.value)}
                     placeholder="숫자만 입력해 주세요."
                     className="flex-1 h-9 px-3 border border-border-light rounded-lg text-[14px] font-medium leading-[1.5] text-foreground placeholder:text-disabled-foreground bg-background outline-none"
                  />
               </div>
            )}

            {/* 정보 저장 체크박스 */}
            {receiptType !== 'none' && (
               <label className="flex items-center gap-1 cursor-pointer">
                  <Checkbox
                     checked={saveInfo}
                     onCheckedChange={v => onChangeSaveInfo(!!v)}
                  />
                  <span className="text-[16px] font-medium leading-[1.5] text-muted-foreground">
                     현금영수증 정보 저장
                  </span>
               </label>
            )}
         </div>
      </PaymentCard>
   );
}

// ── 결제 방법 레이블 매핑 ────────────────────────────────────────────
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
   card: '신용/체크카드',
   kakao: '카카오페이',
   naver: '네이버페이',
   toss: '토스페이',
   bank: '무통장 입금',
};
