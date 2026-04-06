import { useQuery } from '@tanstack/react-query';
import ResellRegisterDialog from './ResellRegisterDialog';
import QrViewDialog from './QrViewDialog';
import CancelBookingDialog from './CancelBookingDialog';
import NoAccountDialog from './NoAccountDialog';
import ActionStatusDialog from './ActionStatusDialog';
import { fetchOrderTickets } from '@/entities/ticket/api/ticketApi';
import { MYPAGE_ACTION_TICKET_INFO_ERROR_SCENARIO } from '@/shared/api/mockScenarios';
import type { PurchaseHistoryItem } from '../model/historyCard';

interface HistoryCardDialogsProps {
   purchaseItem: PurchaseHistoryItem | null;
   resellOpen: boolean;
   cancelOpen: boolean;
   noAccountOpen: boolean;
   qrOpen: boolean;
   mockTicketInfoError: boolean;
   onResellCompleteConfirm?: () => void;
   onCloseResell: () => void;
   onCloseCancel: () => void;
   onCloseNoAccount: () => void;
   onCloseQr: () => void;
}

export function useHistoryCardTickets({
   purchaseItem,
   mockTicketInfoError,
   qrOpen,
   resellOpen,
}: Pick<HistoryCardDialogsProps, 'purchaseItem' | 'mockTicketInfoError' | 'qrOpen' | 'resellOpen'>) {
   const purchaseOrderId = purchaseItem?.rawOrderId;

   return useQuery({
      queryKey: ['historyCardOrderTickets', purchaseOrderId, mockTicketInfoError],
      queryFn: () =>
         fetchOrderTickets(purchaseOrderId!, {
            mockScenario: mockTicketInfoError ? MYPAGE_ACTION_TICKET_INFO_ERROR_SCENARIO : undefined,
         }),
      enabled: Boolean(purchaseOrderId) && (qrOpen || resellOpen),
      staleTime: 0,
   });
}

export function HistoryCardDialogs({
   purchaseItem,
   resellOpen,
   cancelOpen,
   noAccountOpen,
   qrOpen,
   mockTicketInfoError,
   onResellCompleteConfirm,
   onCloseResell,
   onCloseCancel,
   onCloseNoAccount,
   onCloseQr,
}: HistoryCardDialogsProps) {
   const actionTicketsQuery = useHistoryCardTickets({
      purchaseItem,
      mockTicketInfoError,
      qrOpen,
      resellOpen,
   });
   const actionTickets = actionTicketsQuery.data ?? [];

   if (!purchaseItem) {
      return null;
   }

   return (
      <>
         {resellOpen &&
            (actionTicketsQuery.isLoading ? (
               <ActionStatusDialog
                  open={resellOpen}
                  title="리셀 판매 등록"
                  message="판매 가능한 티켓 정보를 불러오는 중입니다."
                  onClose={onCloseResell}
               />
            ) : actionTicketsQuery.isError ? (
               <ActionStatusDialog
                  open={resellOpen}
                  title="리셀 판매 등록"
                  message="판매 가능한 티켓 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
                  onClose={onCloseResell}
                  onRetry={() => {
                     void actionTicketsQuery.refetch();
                  }}
               />
            ) : actionTickets.length > 0 ? (
               <ResellRegisterDialog
                  open={resellOpen}
                  onClose={onCloseResell}
                  onCompleteConfirm={onResellCompleteConfirm}
                  item={{
                     ...purchaseItem,
                     ticketIds: actionTickets.map(ticket => ticket.ticketId),
                  }}
               />
            ) : (
               <ActionStatusDialog
                  open={resellOpen}
                  title="리셀 판매 등록"
                  message="판매 가능한 티켓이 없습니다."
                  onClose={onCloseResell}
               />
            ))}

         {noAccountOpen && <NoAccountDialog open={noAccountOpen} onClose={onCloseNoAccount} />}

         {cancelOpen && (
            <CancelBookingDialog
               open={cancelOpen}
               onClose={onCloseCancel}
               orderId={purchaseItem.rawOrderId ?? purchaseItem.id}
               game={{ teams: purchaseItem.game.teams, datetime: purchaseItem.game.datetime }}
               mockTicketInfoError={mockTicketInfoError}
               seats={purchaseItem.game.seats.map(seat => ({
                  orderId: purchaseItem.orderId,
                  section: purchaseItem.game.section,
                  seatDetail: seat,
                  price:
                     purchaseItem.game.seats.length > 0
                        ? Math.round(purchaseItem.price / purchaseItem.game.seats.length)
                        : purchaseItem.price,
               }))}
            />
         )}

         {qrOpen && (
            <QrViewDialog
               open={qrOpen}
               onClose={onCloseQr}
               seats={actionTickets.map(ticket => ({
                  ticketId: ticket.ticketId,
                  section: ticket.seatInfo.split(' ')[0] ?? '',
                  seatDetail: ticket.seatInfo,
               }))}
               isTicketInfoLoading={actionTicketsQuery.isLoading}
               isTicketInfoError={actionTicketsQuery.isError}
               onRetryTicketInfo={() => {
                  void actionTicketsQuery.refetch();
               }}
            />
         )}
      </>
   );
}
