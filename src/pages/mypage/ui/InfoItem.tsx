// src/pages/mypage/ui/InfoItem.tsx

export interface InfoRow {
   label: string;
   value: string;
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


function InfoRowItem({ label, value, valueBold = false }: InfoRow) {
   return (
      <div className="flex items-start gap-3 text-body-1-regular">
         <span className="flex-1 min-w-0 text-muted-foreground leading-[1.5]">{label}</span>
         <span className={`shrink-0 text-right whitespace-nowrap leading-[1.5] ${valueBold ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
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
               <p key={i} className="text-body-3-medium text-muted-foreground leading-[1.5]">
                  {t}
               </p>
            ))}
         </div>
      </div>
   );
}


export default function InfoItem(props: InfoItemProps) {
   const { heading, helperTexts, className = '' } = props;

   return (
      <div className={`border border-border rounded-2xl p-[25px] flex flex-col gap-6 ${className}`}>
         {props.type === 'payment' ? (
            <>
               <div className="flex items-start">
                  <h2 className="flex-1 text-heading-3-bold text-foreground">{heading}</h2>
                  {props.statusText && (
                     <span className={`text-heading-3-bold whitespace-nowrap ${props.statusColor ?? 'text-primary'}`}>
                        {props.statusText}
                     </span>
                  )}
               </div>

               <div className="bg-surface rounded-xl p-5 flex flex-col gap-3">
                  {props.summaryRows.map((row, i) => (
                     <div key={i} className="flex items-start text-body-1-regular gap-3">
                        <span className="flex-1 text-muted-foreground leading-[1.5]">{row.label}</span>
                        <span className="text-foreground whitespace-nowrap leading-[1.5]">
                           {row.amount.toLocaleString()}원
                        </span>
                     </div>
                  ))}
                  <div className="flex items-center gap-3 font-bold">
                     <span className="flex-1 text-body-1-bold text-muted-foreground leading-[1.5]">{props.totalLabel}</span>
                     <span className={`text-heading-3-bold whitespace-nowrap leading-[1.5] ${props.totalColor ?? 'text-primary'}`}>
                        {props.totalAmount.toLocaleString()}원
                     </span>
                  </div>
               </div>

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
               <h2 className="text-heading-3-bold text-foreground">{heading}</h2>
               <div className="flex flex-col gap-3">
                  {props.rows.map((row, i) => (
                     <InfoRowItem key={i} {...row} />
                  ))}
               </div>
            </>
         )}

         {helperTexts && helperTexts.length > 0 && <HelperBox texts={helperTexts} />}
      </div>
   );
}
