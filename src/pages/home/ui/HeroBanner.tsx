import { Button } from '@/shared/ui/button';
import { useRef, useState } from 'react';

const SWIPE_THRESHOLD = 50; // px — 이 이상 드래그해야 슬라이드 전환

type BannerSlide = {
   id: number;
   backgroundImage: string;
   title: string[];
   subtitle: string[];
   buttonLabel: string;
};

// TODO: 배너 이미지 작업 후 실제 이미지로 교체
const slides: BannerSlide[] = [
   {
      id: 1,
      backgroundImage: 'https://www.figma.com/api/mcp/asset/a8aac6f7-9970-4d0a-bb92-d0464a081411',
      title: ['2026', 'KBO 시즌권'],
      subtitle: ['2026.02.03(TUE) 18:00', '판매오픈'],
      buttonLabel: '일정보기',
   },
];

const HeroBanner = () => {
   const [current, setCurrent] = useState(0);
   const [dragOffset, setDragOffset] = useState(0);
   const [isDragging, setIsDragging] = useState(false);
   const startX = useRef(0);

   const goTo = (index: number) => {
      setCurrent(Math.max(0, Math.min(index, slides.length - 1)));
   };

   const handleDragStart = (clientX: number) => {
      if (slides.length <= 1) return;
      startX.current = clientX;
      setIsDragging(true);
   };

   const handleDragMove = (clientX: number) => {
      if (!isDragging) return;
      const delta = clientX - startX.current;
      const isAtStart = current === 0 && delta > 0;
      const isAtEnd = current === slides.length - 1 && delta < 0;
      setDragOffset(isAtStart || isAtEnd ? delta * 0.2 : delta);
   };

   const handleDragEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);
      if (dragOffset < -SWIPE_THRESHOLD) goTo(current + 1);
      else if (dragOffset > SWIPE_THRESHOLD) goTo(current - 1);
      setDragOffset(0);
   };

   const translateX = -(current * 100) + (dragOffset / (typeof window !== 'undefined' ? window.innerWidth : 1)) * 100;

   return (
      <div
         className="relative w-full overflow-hidden select-none"
         onTouchStart={e => handleDragStart(e.touches[0].clientX)}
         onTouchMove={e => handleDragMove(e.touches[0].clientX)}
         onTouchEnd={handleDragEnd}
         onMouseDown={e => handleDragStart(e.clientX)}
         onMouseMove={e => handleDragMove(e.clientX)}
         onMouseUp={handleDragEnd}
         onMouseLeave={handleDragEnd}
      >
         {/* 슬라이드 트랙 */}
         <div
            className="flex"
            style={{
               transform: `translateX(${translateX}%)`,
               transition: isDragging ? 'none' : 'transform 500ms ease-in-out',
            }}
         >
            {slides.map(slide => (
               <div key={slide.id} className="relative shrink-0 w-full py-12.5 px-4">
                  {/* 배경 이미지 — Figma: h=246%, top=-73% */}
                  <div className="absolute inset-0 overflow-hidden">
                     <img
                        src={slide.backgroundImage}
                        alt=""
                        className="absolute w-full opacity-60 pointer-events-none"
                        style={{ height: '246.15%', top: '-73.08%' }}
                        draggable={false}
                     />
                  </div>
                  {/* 그라디언트 오버레이 */}
                  <div
                     className="absolute inset-0"
                     style={{
                        background:
                           'linear-gradient(to right, #221710 0%, rgba(34,23,16,0.8) 26.923%, rgba(34,23,16,0) 100%)',
                     }}
                  />
                  {/* 콘텐츠 */}
                  <div className="relative w-full max-w-300 mx-auto px-8">
                     <div className="flex flex-col gap-6 max-w-2xl">
                        <h1 className="text-[48px] font-bold leading-[1.33] tracking-[-0.05px] text-white">
                           {slide.title.map((line, i) => (
                              <span key={i} className="block">
                                 {line}
                              </span>
                           ))}
                        </h1>
                        <p className="text-[18px] font-medium leading-[1.55] text-[#f1f2f4]">
                           {slide.subtitle.map((line, i) => (
                              <span key={i} className="block">
                                 {line}
                              </span>
                           ))}
                        </p>
                        <Button
                           variant="primary"
                           className="bg-black/20 w-50 hover:bg-black/30 shadow-[inset_0_0_0_1px_var(--border-normal)]"
                           onMouseDown={e => e.stopPropagation()}
                        >
                           {slide.buttonLabel}
                        </Button>
                     </div>
                  </div>
               </div>
            ))}
         </div>

         {/* 인디케이터 (슬라이드 2개 이상일 때만 표시) */}
         {slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
               {slides.map((_, i) => (
                  <button
                     key={i}
                     onMouseDown={e => e.stopPropagation()}
                     onClick={() => goTo(i)}
                     className={`h-2 rounded-full transition-all duration-300 ${
                        i === current ? 'w-5 bg-white' : 'w-2 bg-white/50'
                     }`}
                  />
               ))}
            </div>
         )}
      </div>
   );
};

export default HeroBanner;
