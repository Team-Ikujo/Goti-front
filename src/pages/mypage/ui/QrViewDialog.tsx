// src/pages/mypage/ui/QrViewDialog.tsx

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RefreshCcw, Clock } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/shared/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { fetchTicketQr } from '@/entities/ticket/api/ticketApi';

const QR_DURATION = 180; // 3분

export interface QrSeat {
   ticketId?: string;
   section: string;
   seatDetail: string;
}

interface QrViewDialogProps {
   open: boolean;
   onClose: () => void;
   seats: QrSeat[];
}

function formatTime(seconds: number): string {
   const m = Math.floor(seconds / 60).toString().padStart(2, '0');
   const s = (seconds % 60).toString().padStart(2, '0');
   return `${m}:${s}`;
}

export default function QrViewDialog({ open, onClose, seats }: QrViewDialogProps) {
   const [currentIndex, setCurrentIndex] = useState(0);
   const [timeLeft, setTimeLeft] = useState(QR_DURATION);
   const [qrKey, setQrKey] = useState(0); // 새로고침 시 QR 갱신용 키

   const currentSeat = seats[currentIndex];

   const { data: qrData, refetch: refetchQr } = useQuery({
      queryKey: ['ticketQr', currentSeat?.ticketId, qrKey],
      queryFn: () => fetchTicketQr(currentSeat!.ticketId!),
      enabled: open && !!currentSeat?.ticketId,
      staleTime: QR_DURATION * 1000,
   });

   // 팝업 열릴 때 초기화
   useEffect(() => {
      if (!open) return;
      setCurrentIndex(0);
      setTimeLeft(QR_DURATION);
   }, [open]);

   // 카운트다운 타이머
   useEffect(() => {
      if (!open) return;
      const interval = setInterval(() => {
         setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
   }, [open, qrKey]);

   const handleRefresh = useCallback(() => {
      setTimeLeft(QR_DURATION);
      setQrKey(k => k + 1);
      refetchQr();
   }, [refetchQr]);

   if (!currentSeat) return null;

   return (
      <Dialog open={open} onOpenChange={isOpen => { if (!isOpen) onClose(); }}>
         <DialogContent
            showCloseButton={false}
            className="p-0 w-[340px] max-w-[340px] rounded-[16px] border-0 bg-white overflow-hidden"
         >
            <div className="flex flex-col items-center gap-6 px-5 pt-[30px] pb-5">

               {/* 좌석 정보 */}
               <div className="flex flex-col items-center">
                  <p className="text-[18px] font-bold text-[#161d24] leading-[1.55]">{currentSeat.section}</p>
                  <p className="text-[14px] font-medium text-[#646f7c] leading-[1.5]">{currentSeat.seatDetail}</p>
               </div>

               {/* QR + 네비게이션 */}
               <div className="flex flex-col items-center gap-2">

                  {/* 도트 인디케이터 */}
                  {seats.length > 1 && (
                     <div className="flex gap-3 h-2">
                        {seats.map((_, i) => (
                           <button
                              key={i}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                 i === currentIndex ? 'bg-primary' : 'bg-[#d0d6db]'
                              }`}
                              onClick={() => setCurrentIndex(i)}
                           />
                        ))}
                     </div>
                  )}

                  {/* QR 이미지 + 좌우 화살표 */}
                  <div className="flex items-center gap-5">
                     <button
                        className="text-[#646f7c] disabled:opacity-30"
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                     >
                        <ChevronLeft size={24} />
                     </button>

                     <div className="w-[200px] h-[200px] flex items-center justify-center bg-surface rounded-xl overflow-hidden">
                        {qrData?.qrToken ? (
                           <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.qrToken)}`}
                              alt="QR 코드"
                              className="w-full h-full object-contain"
                           />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                              QR 코드
                           </div>
                        )}
                     </div>

                     <button
                        className="text-[#646f7c] disabled:opacity-30"
                        onClick={() => setCurrentIndex(prev => Math.min(seats.length - 1, prev + 1))}
                        disabled={currentIndex === seats.length - 1}
                     >
                        <ChevronRight size={24} />
                     </button>
                  </div>

                  {/* 타이머 */}
                  <div className="flex items-center gap-1.5 px-1.5">
                     <Clock size={16} className="text-destructive" />
                     <span className="text-[11px] font-medium text-destructive leading-[1.45]">
                        {formatTime(timeLeft)}
                     </span>
                  </div>
               </div>

               {/* 안내 텍스트 */}
               <div className="flex flex-col items-center">
                  <p className="text-[16px] font-semibold text-[#161d24] leading-[1.5]">입장을 위한 QR코드</p>
                  <p className="text-[14px] text-[#646f7c] leading-[1.5]">생성된 QR코드를 입장시 보여주세요.</p>
               </div>

               {/* 버튼 */}
               <div className="flex flex-col gap-1.5 w-full">
                  <Button
                     variant="none"
                     className="w-full border border-border rounded-lg py-1.5 gap-2 hover:bg-surface hover:border-[#b0b8c1] transition-colors"
                     onClick={handleRefresh}
                  >
                     <RefreshCcw size={16} />
                     <span className="text-[14px] font-medium text-[#374553]">새로고침</span>
                  </Button>
                  <DialogClose asChild>
                     <Button variant="primary" className="w-full py-1.5" onClick={onClose}>
                        닫기
                     </Button>
                  </DialogClose>
               </div>

            </div>
         </DialogContent>
      </Dialog>
   );
}
