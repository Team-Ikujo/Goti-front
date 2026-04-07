import { useNavigate } from 'react-router-dom';
import CancelBookingDialog from './CancelBookingDialog';
import ResellRegisterDialog from './ResellRegisterDialog';
import QrViewDialog from './QrViewDialog';
import type { OrderTicket } from '@/entities/ticket/api/ticketApi';
import { formatTicketNumber, getTicketNumberKind } from '../model/ticketNumber';

const parseGradeName = (seatInfo: string): string => {
   const tokens = seatInfo.split(' ');
   const sectionIndex = tokens.findIndex((token) => token.endsWith('구역'));
   if (sectionIndex > 0) return tokens.slice(0, sectionIndex).join(' ');
   const rowIndex = tokens.findIndex((token) => /^[A-Z가-힣\d]+열$/.test(token));
   return rowIndex > 0 ? tokens.slice(0, rowIndex).join(' ') : (tokens[0] ?? '');
};

const parseSeatDetail = (seatInfo: string): string => {
   const tokens = seatInfo.split(' ');
   const sectionIndex = tokens.findIndex((token) => token.endsWith('구역'));
   if (sectionIndex > 0) return tokens.slice(sectionIndex).join(' ');
   const rowIndex = tokens.findIndex((token) => /^[A-Z가-힣\d]+열$/.test(token));
   return rowIndex > 0 ? tokens.slice(rowIndex).join(' ') : tokens.slice(1).join(' ');
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
      seatItems: Array<{ ticketId: string; section: string; seatDetail: string; status: string }>;
   };
   orderTickets: OrderTicket[];
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
   orderTickets,
   isBankTransfer,
   qrOpen,
   cancelOpen,
   resellOpen,
   onCloseQr,
   onCloseCancel,
   onCloseResell,
}: PurchaseDetailDialogsProps) {
   const navigate = useNavigate();
   const sellableOrderTickets = orderTickets.filter((ticket) => ticket.ticketStatus === 'ISSUED');

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
               seats={orderTickets.map((ticket) => ({
                  orderId: formatTicketNumber(
                     ticket.ticketNumber,
                     ticket.ticketStatus === 'RESALE_ISSUED' ? 'resale' : getTicketNumberKind(ticket.ticketNumber, 'ticket'),
                  ),
                  section: ticket.seatInfo.split(' ')[0] ?? '',
                  seatDetail: ticket.seatInfo,
                  price: ticket.ticketPrice,
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
                     quantity: sellableOrderTickets.length > 0 ? sellableOrderTickets.length : detail.seatItems.length,
                     section:
                        (sellableOrderTickets[0]?.seatInfo
                           ? parseGradeName(sellableOrderTickets[0].seatInfo)
                           : undefined) ??
                        detail.seatItems[0]?.section ??
                        parseGradeName(detail.seatInfo),
                     seats:
                        sellableOrderTickets.length > 0
                           ? sellableOrderTickets.map((ticket) => parseSeatDetail(ticket.seatInfo))
                           : detail.seatItems.length > 0
                              ? detail.seatItems.map((seat) => seat.seatDetail)
                           : [parseSeatDetail(detail.seatInfo)],
                  },
                  price:
                     sellableOrderTickets.length > 0
                        ? sellableOrderTickets.reduce((sum, ticket) => sum + ticket.ticketPrice, 0)
                        : detail.ticketPrice,
                  paymentStatus: '예매 완료',
                  deliveryType: '모바일 티켓',
                  canSell: detail.canSell,
                  ticketIds: sellableOrderTickets.map((ticket) => ticket.ticketId),
                  seatPrices: sellableOrderTickets.map((ticket) => ticket.ticketPrice),
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
