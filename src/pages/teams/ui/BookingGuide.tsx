import kboSafetyImg from '@/shared/ui/image/image 191.png';

export function BookingGuide() {
   return (
      <div className="bg-[#f7f8f9] flex flex-col gap-12.5 items-start overflow-hidden px-6.25 md:px-12.5 py-7.5 rounded-[10px] w-full">
         <div className="flex flex-col gap-2.5 items-start w-full">
            <p className="text-[18px] font-semibold text-foreground leading-[1.55]">예매안내</p>
            <div className="text-[14px] md:text-[16px] font-medium text-foreground leading-normal whitespace-pre-wrap">
               <p className="mb-2">1. 예매 가능시간 : 경기당일 경기시작 1시간 후까지</p>
               <p className="mb-2">
                  2. 예매티켓 취소 가능시간 : 경기당일 경기시간 4시간 전까지{'\n'}
                  {'    '}*부분취소는 불가합니다. 기존 예매 건을 전체취소 후 재예매를 진행해야 하며, 취소 후 기존 좌석에
                  대한 선점은 보장되지 않습니다.
               </p>
               <p className="mb-2">
                  3. 현장 매표소 운영시간 : 평일 경기 시작 1시간 30분 전 / 주말,공휴일 경기 시작 2시간 전 시작 (변경 시
                  별도 공지)
               </p>
               <p className="mb-2">
                  4. 예매정책{'\n'}
                  {'   '}*매수제한 : 1회 4매{'\n'}
                  {'   '}*예매수수료 : 장당 2,000원
               </p>
               <p className="mb-2">
                  {'   '}
                  <span className="text-destructive">
                     *문화누리카드의 부정이용 적발시 처벌의 대상이 될 수 있습니다.
                  </span>
               </p>
               <p className="mb-2 text-destructive">
                  {'    '}*무통장입금은 예매 당일 23시 30분까지 입금하지 않으면 자동 취소됩니다.
               </p>
               <p className="mb-2 text-destructive">{'    '}*무통장입금은 경기일 기준 2일 전까지 사용 가능합니다.</p>
               <p className="mb-2">
                  {'  '}
                  <span className="text-primary">
                     *NOL존(익사이팅존) 안내{'\n'}
                     {'    '}NOL존(익사이팅존)은 안전상 문제로 초등학생까지는 관람 불가합니다. (보호자 동반시에도
                     입장불가){'\n'}
                     {'   '}*군인 할인은 휴가증을 기준으로 할인 적용 됩니다.{'\n'}
                     {'    '}간부(부사관/장교/ 후보생 포함)의 경우 할인 적용이 불가합니다.
                  </span>
               </p>
               <p className="mb-2 text-destructive">
                  {'   '}*휠체어 장애인석은 복지증을 기준으로 구매 가능합니다.{'\n'}
                  {'    '}단순 부상에 의한 휠체어 사용 고객은 휠체어 장애인석 구매가 불가합니다.
               </p>
               <p className="mb-2">{'   '}*우천 취소 안내</p>
               <p className="mb-2">
                  {'  '}- 우천 취소 확정 시, 예매내역은 익일 전액환불 및 일괄취소 처리됩니다. (주말 경기 취소 시, 차주
                  월요일 취소 처리됨)
               </p>
               <p className="mb-2">
                  {'  '}- 우천 취소 확정 전, 예매자 판단에 의한 취소 건은 취소 수수료 환불이 불가합니다. (임의판단에
                  의한 선 취소 건은 취소 수수료 부과됨)
               </p>
               <p className="mb-2">{'   '}*사석방지 기능 활성화 안내</p>
               <p className="mb-2">
                  {'  '}- 사석방지 기능 : 타인이 예매를 하지 못하도록 1자리를 남겨두고 좌석을 선택할 경우, 예매 불가능한
                  기능
               </p>
               <p className="mb-2">{'  '}- 남아있는 좌석 중, 끝 1자리만 남겨두면 예매불가</p>
               <p>{'  '}- 중간 1자리를 띄우면 예매불가</p>
            </div>
         </div>

         <div className="flex flex-col gap-2.5 items-start w-full">
            <p className="text-[18px] font-semibold text-foreground leading-[1.55]">티켓수령 및 입장</p>
            <div className="text-[14px] md:text-[16px] font-medium text-foreground leading-normal whitespace-pre-wrap">
               <p className="mb-2">
                  1. 경기당일 매표소가 혼잡하오니, 가급적 모바일티켓을 활용하여 편안한 입장을 권장드립니다.
               </p>
               <p className="mb-2">{'   '}*모바일 티켓은 바로 출입구에서 입장이 가능합니다.</p>
               <p className="mb-2">
                  {'   '}*모바일 티켓 캡쳐 혹은 이미지는 입장 불가{'\n'}
                  {'   '}(어플에서 예약번호 혹은 바코드가 실시간으로 움직이는 티켓만 입장가능)
               </p>
               <p className="mb-2">
                  {'   '}*모바일 티켓으로 티켓선물하기 기능 사용하여 티켓을 선물한 경우 취소 불가{'\n'}
                  {'    '}(선물한 티켓이 반납된 이후 취소가능)
               </p>
               <p className="mb-2">
                  2. 본인확인이 힘들 경우, 입장권 교환이 불가할 수 있습니다.{'\n'}3. 증빙이 필요한 할인권종의 경우
                  모바일티켓 사용 및 키오스크 발권이 어렵습니다. 할인 권종을 예매하신 고객님들은 현장 매표소에서 증빙
                  확인 후 입장권 교환이 가능하며 증빙이 없을 경우 입장권 교환이 불가합니다.
               </p>
               <p className="mb-2">
                  * 어린이 권종은 현장 매표소에 어린이가 직접 방문하여 어린이의 실관람 여부가 확인된 후 입장권 교환이
                  가능합니다.
               </p>
               <p className="mb-2">* 할인권종은 대리 수령 및 대리 관람이 불가합니다.</p>
               <p className="mb-2">* 현장 증빙 시 할인 대상자가 부재할 경우 티켓 수령에 제한이 있을 수 있습니다.</p>
               <p className="mb-2">
                  4. 경기 당일 주차장이 협소하여 사용이 불가할 수 있으니, 가능하면 대중교통 이용 바랍니다.{'\n'}
                  {'  '}(주차장 이용 불가로 인한 경기 티켓 교환,환불은 불가합니다)
               </p>
               <p className="mb-2 text-destructive">5. 예매하신 티켓의 전매, 위조 등의 위법행위를 엄격히 금지합니다.</p>
               <p className="mb-2 text-destructive">
                  {' '}
                  * 티켓 예매 후 타인에게 재판매하거나 양도/양수 과정에서 예매자의 신상정보를 타인에게 임의로 전달시에는
                  판매자와 구매자 모두 피해를 입을 수 있습니다. 이로 인한 피해에 대해서는 구단과 구단과 계약된 티켓판매
                  업체는 일절 책임지지 않습니다.
               </p>
               <p className="text-destructive">
                  {' '}
                  * 순수한 관람 목적이 아닌 티켓 재판매의 의도로 예매를 하거나, 티켓을 위조나 변조하여 판매하는 등의
                  경우 주최측의 권한으로 사전 통보없이 구매취소 및 강제폐기(압류)할 수 있음을 알려드립니다.
               </p>
            </div>
         </div>

         <div className="aspect-835/500 w-full rounded-[20px] md:rounded-[44px] overflow-hidden">
            <img src={kboSafetyImg} alt="KBO 안전 안내" className="w-full h-full object-cover" />
         </div>
      </div>
   );
}
