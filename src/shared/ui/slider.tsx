// src/shared/ui/slider.tsx

import { cn } from '@/shared/lib/utils';

// 공통 thumb 스타일 — 디자인 시스템 기준:
// 14px container / 안쪽 12px 흰 원 + foreground 테두리
const thumbStyle =
   'pointer-events-none ' +
   '[&::-webkit-slider-thumb]:pointer-events-auto ' +
   '[&::-webkit-slider-thumb]:appearance-none ' +
   '[&::-webkit-slider-thumb]:size-3.5 ' + // 14px
   '[&::-webkit-slider-thumb]:rounded-full ' +
   '[&::-webkit-slider-thumb]:bg-white ' +
   '[&::-webkit-slider-thumb]:border ' +
   '[&::-webkit-slider-thumb]:border-foreground ' +
   '[&::-webkit-slider-thumb]:cursor-pointer ' +
   '[&::-webkit-slider-thumb]:transition-shadow ' +
   '[&::-webkit-slider-thumb]:focus-visible:shadow-[0_0_0_3px_#d4d4d4]';

/* ─────────────────────────────────────
   RangeSlider — 두 핸들 (min / max)
───────────────────────────────────── */
interface RangeSliderProps {
   min?: number;
   max?: number;
   step?: number;
   minValue: number;
   maxValue: number;
   onChange: (min: number, max: number) => void;
   className?: string;
}

export function RangeSlider({
   min = 0,
   max = 100,
   step = 1,
   minValue,
   maxValue,
   onChange,
   className,
}: RangeSliderProps) {
   const range = max - min;
   const leftPct = ((minValue - min) / range) * 100;
   const rightPct = ((max - maxValue) / range) * 100;

   // 두 핸들이 같은 위치일 때 min 핸들을 위로 올려 클릭 가능하게 처리
   const minZ = minValue >= maxValue ? 'z-20' : 'z-10';
   const maxZ = minValue >= maxValue ? 'z-10' : 'z-20';

   const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      onChange(Math.min(v, maxValue - step), maxValue);
   };

   const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      onChange(minValue, Math.max(v, minValue + step));
   };

   return (
      <div className={cn('relative h-4 flex items-center', className)}>
         <div className="absolute inset-x-0 h-1.5 rounded-full bg-[#d4d4d4]">
            <div
               className="absolute h-full bg-foreground rounded-full"
               style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
            />
         </div>

         {/* Min 핸들 */}
         <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={minValue}
            onChange={handleMinChange}
            className={cn('absolute inset-0 w-full appearance-none bg-transparent', minZ, thumbStyle)}
         />

         {/* Max 핸들 */}
         <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={maxValue}
            onChange={handleMaxChange}
            className={cn('absolute inset-0 w-full appearance-none bg-transparent', maxZ, thumbStyle)}
         />
      </div>
   );
}

/* ─────────────────────────────────────
   Slider — 단일 핸들
───────────────────────────────────── */
interface SliderProps {
   min?: number;
   max?: number;
   step?: number;
   value: number;
   onChange: (value: number) => void;
   className?: string;
}

export function Slider({ min = 0, max = 100, step = 1, value, onChange, className }: SliderProps) {
   const range = max - min;
   const rightPct = ((max - value) / range) * 100;

   return (
      <div className={cn('relative h-4 flex items-center', className)}>
         {/* Track */}
         <div className="absolute inset-x-0 h-1.5 rounded-full bg-[#d4d4d4]">
            <div className="absolute h-full bg-foreground rounded-full" style={{ left: '0%', right: `${rightPct}%` }} />
         </div>

         <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            className={cn('absolute inset-0 w-full appearance-none bg-transparent z-10', thumbStyle)}
         />
      </div>
   );
}
