// src/pages/mypage/ui/QrViewDialog.tsx

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, RefreshCcw, Clock } from 'lucide-react';
import { fetchTicketQr } from '@/entities/ticket/api/ticketApi';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/shared/ui/dialog';

const QR_DURATION = 180; // 3분
const QR_IMAGE_SRC = '/images/QR%EC%BD%94%EB%93%9C.png';

export interface QrSeat {
   ticketId?: string;
   section: string;
   seatDetail: string;
}

interface QrViewDialogProps {
   open: boolean;
   onClose: () => void;
   seats: QrSeat[];
   isTicketInfoLoading?: boolean;
   isTicketInfoError?: boolean;
   onRetryTicketInfo?: () => void;
}

function formatTime(seconds: number): string {
   const m = Math.floor(seconds / 60).toString().padStart(2, '0');
   const s = (seconds % 60).toString().padStart(2, '0');
   return `${m}:${s}`;
}

function getRemainingSeconds(expiresAt?: string): number {
   if (!expiresAt) return QR_DURATION;

   const diffSeconds = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
   return Math.max(diffSeconds, 0);
}

export default function QrViewDialog({
   open,
   onClose,
   seats,
   isTicketInfoLoading = false,
   isTicketInfoError = false,
   onRetryTicketInfo,
}: QrViewDialogProps) {
   const [currentIndex, setCurrentIndex] = useState(0);
   const [timeLeft, setTimeLeft] = useState(QR_DURATION);

   const currentSeat = seats[currentIndex];
   const currentTicketId = currentSeat?.ticketId;
   const qrQuery = useQuery({
      queryKey: ['ticketQr', currentTicketId],
      queryFn: () => fetchTicketQr(currentTicketId!),
      enabled: open && Boolean(currentTicketId),
      retry: false,
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

      if (qrQuery.data?.expiresAt) {
         setTimeLeft(getRemainingSeconds(qrQuery.data.expiresAt));
      }

      const interval = setInterval(() => {
         if (qrQuery.data?.expiresAt) {
            setTimeLeft(getRemainingSeconds(qrQuery.data.expiresAt));
            return;
         }

         setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(interval);
   }, [open, qrQuery.data?.expiresAt]);

   const handleRefresh = useCallback(() => {
      if (currentTicketId) {
         void qrQuery.refetch();
         return;
      }

      setTimeLeft(QR_DURATION);
   }, [currentTicketId, qrQuery]);

   const renderStatusContent = () => {
      switch (true as boolean) {
         case isTicketInfoLoading:
            return (
               <div className="flex flex-col items-center gap-4 px-5 pt-7.5 pb-5 text-center">
                  <p className="text-[18px] font-bold text-[#161d24] leading-[1.55]">QR 확인</p>
                  <p className="text-[16px] text-[#374553]">티켓 정보를 불러오는 중입니다.</p>
                  <Button variant="primary" className="w-full py-1.5" onClick={onClose}>
                     닫기
                  </Button>
               </div>
            );
         case isTicketInfoError:
            return (
               <div className="flex flex-col items-center gap-4 px-5 pt-7.5 pb-5 text-center">
                  <p className="text-[18px] font-bold text-[#161d24] leading-[1.55]">QR 확인</p>
                  <p className="text-[16px] text-[#374553]">
                     티켓 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                  </p>
                  <div className="flex w-full gap-2">
                     <Button variant="tertiary" className="flex-1 py-1.5" onClick={onClose}>
                        닫기
                     </Button>
                     <Button variant="primary" className="flex-1 py-1.5" onClick={onRetryTicketInfo}>
                        다시 시도
                     </Button>
                  </div>
               </div>
            );
         case !currentSeat:
            return (
               <div className="flex flex-col items-center gap-4 px-5 pt-7.5 pb-5 text-center">
                  <p className="text-[18px] font-bold text-[#161d24] leading-[1.55]">QR 확인</p>
                  <p className="text-[16px] text-[#374553]">표시할 티켓이 없습니다.</p>
                  <Button variant="primary" className="w-full py-1.5" onClick={onClose}>
                     닫기
                  </Button>
               </div>
            );
         case qrQuery.isError:
            return (
               <div className="flex flex-col items-center gap-4 px-5 pt-7.5 pb-5 text-center">
                  <p className="text-[18px] font-bold text-[#161d24] leading-[1.55]">QR 확인</p>
                  <p className="text-[16px] text-[#374553]">
                     QR 코드를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                  </p>
                  <div className="flex w-full gap-2">
                     <Button variant="tertiary" className="flex-1 py-1.5" onClick={onClose}>
                        닫기
                     </Button>
                     <Button variant="primary" className="flex-1 py-1.5" onClick={handleRefresh}>
                        다시 시도
                     </Button>
                  </div>
               </div>
            );
         default:
            return null;
      }
   };

   const statusContent = renderStatusContent();

   return (
      <Dialog open={open} onOpenChange={isOpen => { if (!isOpen) onClose(); }}>
         <DialogContent
            showCloseButton={false}
            className="p-0 w-[340px] max-w-[340px] rounded-[16px] border-0 bg-white overflow-hidden"
         >
            {statusContent ?? (
               <div className="flex flex-col items-center gap-6 px-5 pt-7.5 pb-5">

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
                                 type="button"
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
                           type="button"
                           className="text-[#646f7c] disabled:opacity-30"
                           onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                           disabled={currentIndex === 0}
                        >
                           <ChevronLeft size={24} />
                        </button>

                        <div className="w-[200px] h-[200px] flex items-center justify-center bg-surface rounded-xl overflow-hidden">
                           <img
                              src={QR_IMAGE_SRC}
                              alt="QR 코드"
                              className="w-full h-full object-contain"
                           />
                        </div>

                        <button
                           type="button"
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
            )}
         </DialogContent>
      </Dialog>
   );
}
