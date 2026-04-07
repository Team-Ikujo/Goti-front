export const MAX_SELECTED_SEATS = 4;
export const MAX_SELECTED_SEATS_MESSAGE = '한 사람당 한 경기에서 최대 4매까지만 예매할 수 있습니다.';

export const getSeatPurchaseLimitExceededMessage = (alreadyPurchasedSeatCount: number) => {
   if (alreadyPurchasedSeatCount <= 0) {
      return MAX_SELECTED_SEATS_MESSAGE;
   }

   const remainingSeatCount = Math.max(0, MAX_SELECTED_SEATS - alreadyPurchasedSeatCount);

   if (remainingSeatCount === 0) {
      return '이미 이 경기의 티켓을 4매 구매하여 추가 예매가 불가능합니다.';
   }

   return `이미 이 경기의 티켓을 ${alreadyPurchasedSeatCount}매 구매하여 추가로 ${remainingSeatCount}매만 예매할 수 있습니다.`;
};
