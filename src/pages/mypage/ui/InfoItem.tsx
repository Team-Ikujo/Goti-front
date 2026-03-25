// src/pages/mypage/ui/InfoItem.tsx

export interface InfoRow {
   label: string;
   value: string;
   /** 값을 bold + 진한 색상으로 표시 */
   valueBold?: boolean;
}

export interface SummaryRow {
   label: string;
   amount: number;
}

interface BaseProps {
   heading: string;
   helperTexts?: string[];
   className?: string;
}

export interface DefaultInfoItemProps extends BaseProps {
   type?: 'default';
   rows: InfoRow[];
}

export interface PaymentInfoItemProps extends BaseProps {
   type: 'payment';
   statusText?: string;
   statusColor?: string;
   summaryRows: SummaryRow[];
   totalLabel: string;
   totalAmount: number;
   totalColor?: string;
   infoRows: InfoRow[];
}

export type InfoItemProps = DefaultInfoItemProps | PaymentInfoItemProps;

// ─── 공유 서브 컴포넌트 ────────────────────────────────────────

function InfoRowItem({ label, value, valueBold = false }: InfoRow) {
   return (
      <div className="flex items-start gap-3 text-body-1-regular">
         <span className="flex-1 min-w-0 text-muted-foreground leading-[1.5]">{label}</span>
         <span className={`shrink-0 text-right whitespace-nowrap leading-[1.5] ${valueBold ? 'font-bold text-[#161d24]' : 'text-[#374553]'}`}>
            {value}
         </span>
      </div>
   );
}

function HelperBox({ texts }: { texts: string[] }) {
   return (
      <div className="bg-surface rounded-xl p-5">
         <div className="flex flex-col gap-0.5">
            {texts.map((t, i) => (
               <p key={i} className="text-[13px] font-medium text-muted-foreground leading-[1.5]">
                  {t}
               </p>
            ))}
         </div>
      </div>
   );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────

export default function InfoItem(props: InfoItemProps) {
   const { heading, helperTexts, className = '' } = props;

   return (
      <div className={`border border-[#e9ebee] rounded-2xl p-[25px] flex flex-col gap-6 ${className}`}>
         {props.type === 'payment' ? (
            <>
               {/* 헤딩 + 상태 */}
               <div className="flex items-start">
                  <h2 className="flex-1 text-[20px] font-bold text-[#161d24] leading-[1.5]">{heading}</h2>
                  {props.statusText && (
                     <span className={`text-[20px] font-bold leading-[1.5] whitespace-nowrap ${props.statusColor ?? 'text-primary'}`}>
                        {props.statusText}
                     </span>
                  )}
               </div>

               {/* 금액 요약 박스 */}
               <div className="bg-surface rounded-xl p-5 flex flex-col gap-3">
                  {props.summaryRows.map((row, i) => (
                     <div key={i} className="flex items-start text-body-1-regular gap-3">
                        <span className="flex-1 text-muted-foreground leading-[1.5]">{row.label}</span>
                        <span className="text-[#161d24] whitespace-nowrap leading-[1.5]">
                           {row.amount.toLocaleString()}원
                        </span>
                     </div>
                  ))}
                  {/* 합계 */}
                  <div className="flex items-center gap-3 font-bold">
                     <span className="flex-1 text-body-1-bold text-[#374553] leading-[1.5]">{props.totalLabel}</span>
                     <span className={`text-[20px] whitespace-nowrap leading-[1.5] ${props.totalColor ?? 'text-primary'}`}>
                        {props.totalAmount.toLocaleString()}원
                     </span>
                  </div>
               </div>

               {/* 상세 정보 행 */}
               {props.infoRows.length > 0 && (
                  <div className="flex flex-col gap-3">
                     {props.infoRows.map((row, i) => (
                        <InfoRowItem key={i} {...row} />
                     ))}
                  </div>
               )}
            </>
         ) : (
            <>
               {/* 헤딩 */}
               <h2 className="text-[20px] font-bold text-[#161d24] leading-[1.5]">{heading}</h2>

               {/* 정보 행 */}
               <div className="flex flex-col gap-3">
                  {props.rows.map((row, i) => (
                     <InfoRowItem key={i} {...row} />
                  ))}
               </div>
            </>
         )}

         {/* 안내 텍스트 (공통) */}
         {helperTexts && helperTexts.length > 0 && <HelperBox texts={helperTexts} />}
      </div>
   );
}
