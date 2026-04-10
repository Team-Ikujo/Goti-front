import { useNavigate } from 'react-router-dom';
import CancelBookingDialog from './CancelBookingDialog';
import ResellRegisterDialog from './ResellRegisterDialog';
import QrViewDialog from './QrViewDialog';

const parseGradeName = (seatInfo: string): string => {
   const tokens = seatInfo.split(' ');
   const sectionIndex = tokens.findIndex((token) => token.endsWith('구역'));
   if (sectionIndex > 0) return tokens.slice(0, sectionIndex).join(' ');
   const rowIndex = tokens.findIndex((token) => /^[A-Z가-힣\d]+열$/.test(token));
   return rowIndex > 0 ? tokens.slice(0, rowIndex).join(' ') : (tokens[0] ?? '');
};

interface PurchaseDetailDialogsProps {
   orderId: string;
   detail: {
      id: string;
      orderId: string;
      orderDate?: string;
      game: { teams: string; venue: string; datetime: string };
      seatInfo: string;
      ticketPrice: number;
      paymentMethodDisplay?: string;
      canSell: boolean;
      paymentSummary: { fee: number };
      seatItems: Array<{ ticketId: string; orderId: string; section: string; seatDetail: string; status: string; price: number }>;
   };
   isBankTransfer: boolean;
   qrOpen: boolean;
   cancelOpen: boolean;
   resellOpen: boolean;
   onCloseQr: () => void;
   onCloseCancel: () => void;
   onCloseResell: () => void;
}

export function PurchaseDetailDialogs({
   orderId,
   detail,
   isBankTransfer,
   qrOpen,
   cancelOpen,
   resellOpen,
   onCloseQr,
   onCloseCancel,
   onCloseResell,
}: PurchaseDetailDialogsProps) {
   const navigate = useNavigate();
   const activeSeatItems = detail.seatItems.filter(
      (seat) => seat.status !== '취소완료' && seat.status !== '판매취소',
   );

   return (
      <>
         {cancelOpen && (
            <CancelBookingDialog
               open={cancelOpen}
               onClose={onCloseCancel}
               orderId={orderId}
               game={{ teams: detail.game.teams, datetime: detail.game.datetime }}
               isBankTransfer={isBankTransfer}
               paymentMethod={detail.paymentMethodDisplay}
               seats={activeSeatItems.map((seat) => ({
                  orderId: seat.orderId,
                  ticketId: seat.ticketId,
                  section: seat.section,
                  seatDetail: seat.seatDetail,
                  price: seat.price,
               }))}
            />
         )}

         {resellOpen && (
            <ResellRegisterDialog
               open={resellOpen}
               onClose={onCloseResell}
               onCompleteConfirm={() => navigate('/mypage', { state: { activeTab: 'sale' } })}
               item={{
                  id: detail.id,
                  rawOrderId: orderId,
                  orderId: detail.orderId,
                  orderDate: detail.orderDate ?? '-',
                  type: '티켓',
                  game: {
                     teams: detail.game.teams,
                     venue: detail.game.venue || '홈구장',
                     datetime: detail.game.datetime,
                     quantity: activeSeatItems.length > 0 ? activeSeatItems.length : detail.seatItems.length,
                     section:
                        activeSeatItems[0]?.section ??
                        parseGradeName(detail.seatInfo),
                     seats:
                        activeSeatItems.length > 0
                           ? activeSeatItems.map((seat) => seat.seatDetail)
                           : [detail.seatInfo],
                  },
                  price:
                     activeSeatItems.length > 0
                        ? activeSeatItems.reduce((sum, seat) => sum + seat.price, 0)
                        : detail.ticketPrice,
                  paymentStatus: '예매 완료',
                  deliveryType: '모바일 티켓',
                  canSell: detail.canSell,
                  ticketIds: activeSeatItems.map((seat) => seat.ticketId),
                  seatPrices: activeSeatItems.map((seat) => seat.price),
               }}
            />
         )}

         <QrViewDialog
            open={qrOpen}
            onClose={onCloseQr}
            seats={detail.seatItems
               .filter((seat) => seat.status !== '취소완료')
               .map((seat) => ({ ticketId: seat.ticketId, section: seat.section, seatDetail: seat.seatDetail }))}
         />
      </>
   );
}
