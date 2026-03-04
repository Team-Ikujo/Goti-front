import { cn } from '@/shared/lib/utils';

type VerificationCodeFieldProps = {
   value: string;
   onChange: (value: string) => void;
   submitted: boolean;
   errorMessage?: string;
   countdown: number;
   formattedCountdown: string;
   onResend: () => void;
};

const VerificationCodeField = ({
   value,
   onChange,
   submitted,
   errorMessage,
   countdown,
   formattedCountdown,
   onResend,
}: VerificationCodeFieldProps) => {
   return (
      <div>
         <div className="flex flex-col gap-1">
            <label className="text-label-2-medium text-[14px] text-muted-foreground">
               인증 번호
               <span className="text-primary">*</span>
            </label>
            <div className="relative w-full">
               <input
                  type="text"
                  placeholder="인증 번호 6자리"
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  aria-invalid={submitted && Boolean(errorMessage)}
                  className={cn(
                     'h-12 w-full rounded-lg border px-4 py-3 outline-none transition-colors antialiased',
                     'text-foreground',
                     'placeholder:text-disabled-foreground',
                     'focus:border-(--border-heavy)',
                     submitted && Boolean(errorMessage) && 'border-destructive focus:border-destructive',
                  )}
               />
               {countdown > 0 && <div className="absolute inset-y-0 right-4 flex items-center text-primary">{formattedCountdown}</div>}
            </div>
            {submitted && errorMessage && <p className="text-xs text-destructive antialiased">{errorMessage}</p>}
         </div>
         {countdown <= 0 && (
            <button type="button" onClick={onResend} className="underline text-(--text-tertiary) text-right w-full mt-1">
               인증번호 재전송
            </button>
         )}
      </div>
   );
};

export default VerificationCodeField;
