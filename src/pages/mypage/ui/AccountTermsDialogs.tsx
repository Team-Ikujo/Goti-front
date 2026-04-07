// src/pages/mypage/ui/AccountTermsDialogs.tsx

import { Dialog, DialogContent } from '@/shared/ui/dialog';

export type TermsType = 'openBanking' | 'thirdParty' | 'personalInfo' | null;

interface AccountTermsDialogsProps {
   termsDialog: TermsType;
   onClose: () => void;
}

export function AccountTermsDialogs({ termsDialog, onClose }: AccountTermsDialogsProps) {
   return (
      <>
         <Dialog open={termsDialog === 'openBanking'} onOpenChange={onClose}>
            <DialogContent maxWidth={600} showCloseButton={true} className="rounded-2xl p-0 gap-0 flex flex-col max-h-[80vh]">
               <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
                  <p className="text-heading-4-bold text-foreground">오픈뱅킹공동업무 자동계좌이체 약관</p>
               </div>
               <div className="overflow-y-auto px-6 py-4 text-body-2-regular text-foreground leading-relaxed flex-1">
                  <p>
                     제1조 (약관의 적용) 오픈뱅킹공동업무를 기반으로 이용기관이 제공하는 이용기관 서비스를 통해
                     본인명의 계좌에서 자금을 출금하고자 하는 개인(이하 "사용자"라 한다)과 오픈뱅킹 참가은행인{' '}
                     <span className="text-destructive">IBK기업은행</span>(이하 "은행"이라 한다)에 대하여 이 약관을
                     적용합니다.
                  </p>
                  <br />
                  <p className="font-bold">제2조 (용어의 정의)</p>
                  <p>① "오픈뱅킹공동업무"란 이용기관과 참가은행이 개별은행과 별도 제휴 없이도 핀테크 서비스를 원활하게 제공할 수 있도록 오픈뱅킹중계센터가 참가은행의 핵심 금융서비스(조회, 이체 등)를 표준화된 오픈API 형태로 운영∙제공하는 업무를 말합니다.</p>
                  <p>② "이용기관"이란 오픈뱅킹공동업무 이용승인을 받아 금융결제원(이하 "결제원")과 오픈뱅킹 이용계약을 체결한 핀테크사업자와 은행을 말합니다.</p>
                  <p>③ "참가은행"이란 오픈뱅킹공동업무에 참가하는 결제원의 사원, 준사원 및 특별참가기관을 말합니다.</p>
                  <p>④ "자동이체"란 이용기관이 사용자의 예금계좌에서 오픈뱅킹공동업무을 통하여 출금하여 이용기관의 수납 모계좌 또는 이용기관의 계정(이하 "계정")으로 집금하는 업무를 말합니다.</p>
                  <p>⑤ "오픈뱅킹중계센터"란 오픈뱅킹공동업무를 구축하고 운영하며, 은행과 이용기관을 서로 중계하는 곳으로 결제원이 담당합니다.</p>
                  <p>⑥ "자동이체정보 통합관리시스템"이란 자동이체 등록내역 및 동의자료를 통합 보관 및 관리하고 사용자가 자동이체 등록내역을 조회, 변경 할 수 있는 기능을 제공하는 금융기관이 공동 개발한 시스템을 말합니다.</p>
                  <br />
                  <p className="font-bold">제3조 (자동이체 신청)</p>
                  <p>① 사용자가 본인명의 계좌의 자동이체를 실행하기 위해서는 오픈뱅킹중계센터가 제공하는 웹페이지 또는 이용기관 서비스에서 출금에 대한 사전 동의를 신청해야 합니다. 신청 정보는 해당 은행으로 전달됩니다.</p>
                  <p>② 사용자는 자동이체를 실행하기 위하여 전자금융거래법 제15조 제1항에 따라 서면(전자서명이 있는 전자문서 포함), ARS·녹취 등에 의하여 출금에 대한 사전동의를 오픈뱅킹중계센터 또는 이용기관에 제출하여야 합니다.</p>
                  <p>③ 사용자는 거래지시와 처리결과가 일치하는지 여부를 확인하여야 합니다. 일치하지 않는 경우에는 이를 즉시 은행에 통지하여야 합니다.</p>
                  <p>④ 은행은 개인정보보호법 및 신용정보의 이용 및 보호에 관한 법률 등에서 정한 바에 따라 사용자의 정보를 관리하여야 하며, 이에 대한 세부적인 내용은 은행의 개인정보처리(취급) 방침에 정한 바에 의합니다.</p>
                  <br />
                  <p className="font-bold">제4조 (자동이체 이용시간)</p>
                  <p>자동이체 이용시간은 연중무휴로 운영되며 하루 중 이용시간은 00시 10분부터 23시 50분까지로 합니다.</p>
                  <br />
                  <p className="font-bold">제5조 (자동이체)</p>
                  <p>① 이용기관이 은행에게 특정 일자에 사용자의 자동이체 신청계좌에서 일정 금원을 출금하여 이용기관의 수납 모계좌 또는 계정으로 이체를 요청하는 경우, 은행은 사용자에게 별도의 통지 없이 자금의 이체를 처리합니다.</p>
                  <p>② 제1항의 경우 은행의 예금약관이나 약정서의 규정에도 불구하고 은행은 예금청구서, 기타 관련 증서 없이 출금이체 처리절차에 의하여 출금할 수 있습니다.</p>
                  <br />
                  <p className="font-bold">제6조 (출금한도)</p>
                  <p>① 자동이체 신청에 의한 사용자의 지정계좌에서의 출금은 이용기관의 출금요청을 접수한 은행의 예금잔액(자동대출 약정이 있는 경우 대출한도 포함)에 한하여 이용기관의 청구대로 출금합니다.</p>
                  <p>② 사용자의 자동이체 출금한도는 오픈뱅킹중계센터 사용자별 이용한도에 따릅니다.</p>
                  <br />
                  <p className="font-bold">제7조 (최초 개시일)</p>
                  <p>자동이체 신규 신청에 의한 자동이체 개시일은 은행이 이용기관으로부터 통지 받은 출금일을 최초 개시일로 합니다.</p>
                  <br />
                  <p className="font-bold">제8조 (신청서 제출기한)</p>
                  <p>자동이체 신규 신청(변경 및 해지 신청 포함)시 해당 출금일 이전까지 신청서를 제출하여야 하며, 신규신청은 전자금융거래법에서 정한 추심이체 출금동의로, 출금이체 해지신청서를 제출한 경우는 추심이체 출금동의의 철회로 봅니다.</p>
                  <br />
                  <p className="font-bold">제9조 (출금기준 및 이의제기)</p>
                  <p>자동이체 신청에 의한 사용자의 지정계좌에서의 출금은 이용기관의 출금요청을 접수한 은행의 제6조에 의한 출금한도에 한하여 이용기관의 청구대로 출금합니다. 다만, 청구금액에 이의가 있는 경우에는 사용자와 이용기관이 협의하여 조정하여야 합니다.</p>
                  <br />
                  <p className="font-bold">제10조 (정보제공)</p>
                  <p>자동이체 업무처리와 관련된 사용자의 생년월일 등의 정보는 이용기관에 제공되지 않으며, 은행은 자동이체 업무 이외의 목적으로 해당 정보를 사용할 수 없습니다.</p>
                  <br />
                  <p className="font-bold">제11조 (은행의 자동이체 해지)</p>
                  <p>은행은 1년 이상 이용기관의 출금요청이 없는 자동이체에 대하여 사용자 또는 이용기관에 상당한 기간을 정하여 이행을 최고하고 그 기간 내에 이행하지 아니한 때에 한하여 자동이체를 해지할 수 있습니다.</p>
                  <br />
                  <p className="font-bold">제12조 (자동이체 통합관리)</p>
                  <p>① 오픈뱅킹공동업무 자동이체는 계좌이동서비스 대상입니다.</p>
                  <p>② 은행은 자동이체정보 통합관리시스템에 사용자의 자동이체 등록정보를 제공하여 사용자가 조회, 해지, 출금계좌 변경 신청이 가능하도록 합니다.</p>
                  <p>③ 사용자가 자동이체 통합관리시스템 또는 은행 채널(영업점 및 인터넷뱅킹 등)에서 출금계좌를 타은행 계좌로 변경 신청할 경우 변경 전 출금계좌에 등록되어 있는 출금이체 해지 후, 변경 후 출금계좌로 신규 등록됩니다.</p>
                  <br />
                  <p className="font-bold">제13조 (면책 사항)</p>
                  <p>이 약관의 면책 사항에 대해서는 전자금융거래기본약관을 준용합니다.</p>
                  <br />
                  <p className="font-bold">제14조 (관할 법원)</p>
                  <p>이 약관에 따른 자동계좌이체와 관련하여 은행과 사용자 사이에 소송의 필요가 있는 경우 관할법원은 민사소송법에서 정하는 바에 따릅니다.</p>
                  <br />
                  <p className="font-bold">제15조 (약관의 변경)</p>
                  <p>은행이 이 약관을 변경하고자 하는 경우에는 전자금융거래기본약관의 약관의 변경 조항을 준용합니다.</p>
                  <br />
                  <p className="font-bold">제16조 (다른 약관과의 관계)</p>
                  <p>① 자동이체 거래에 관하여는 동 약관의 규정이 다른 약관에 우선합니다.</p>
                  <p>② 이 약관과 전자금융거래 기본약관에 정하지 않은 사항에 대하여는 전자금융거래법 등 관계법령을 적용합니다.</p>
                  <p>③ 이 약관에 정하지 않은 사항에 대하여는 은행의 자동이체약관을 따릅니다.</p>
                  <br />
                  <p className="font-bold">부 칙</p>
                  <p>이 약관은 2016년 12월 30일부터 시행합니다.</p>
                  <br />
                  <p className="font-bold">부 칙</p>
                  <p>이 약관은 2017년 8월 21일부터 시행합니다.</p>
                  <br />
                  <p className="font-bold">부 칙</p>
                  <p className="font-bold">제1조 (시행일)</p>
                  <p>이 약관은 2019년 10월 24일부터 시행합니다.</p>
                  <p className="font-bold">제2조 (기존 약관의 적용)</p>
                  <p>'은행권 공동 오픈플랫폼 이용기관'이 제공하는 서비스를 이용 중인 사용자에 대해서는 오픈뱅킹공동업무가 전체 이용기관으로 확대시행 전까지 기존 「은행권 공동 오픈플랫폼 자동계좌이체 약관」을 적용하기로 하며, 확대시행일은 오픈뱅킹중계센터 홈페이지를 통해 공지합니다.</p>
               </div>
               <div className="px-6 pb-6 pt-4 shrink-0">
                  <button
                     onClick={onClose}
                     className="w-full bg-primary text-white text-body-1-bold rounded-lg px-6 py-3 hover:bg-primary-strong transition-colors"
                  >
                     확인
                  </button>
               </div>
            </DialogContent>
         </Dialog>

         <Dialog open={termsDialog === 'thirdParty'} onOpenChange={onClose}>
            <DialogContent maxWidth={600} showCloseButton={true} className="rounded-2xl p-0 gap-0 flex flex-col max-h-[80vh]">
               <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
                  <p className="text-heading-4-bold text-foreground">개인(신용)정보 제3자 제공 동의</p>
               </div>
               <div className="overflow-y-auto px-6 py-4 text-body-2-regular text-foreground leading-relaxed flex-1">
                  <p>고객은 GO-Ti가 만든 서비스를 이용하기 위하여 다음과 같이 본인의 정보를 오픈뱅킹공동업무에 참여하는 은행법 상의 은행이 GO-Ti에게 제공하는 것에 동의합니다.</p>
                  <br />
                  <p className="font-bold text-destructive">오픈뱅킹 참가 은행</p>
                  <p className="text-destructive">
                     KDB산업은행, NH농협은행, 신한은행, 우리은행, SC제일은행, IBK기업은행, KB국민은행, KEB하나은행,
                     씨티은행, 수협은행, 대구은행, 부산은행, 광주은행, 제주은행, 전북은행, 경남은행, 카카오뱅크,
                     케이뱅크, 농협중앙회, 수협중앙회, 신협, 산림조합중앙회, MH새마을금고, 우정사업본부 등
                  </p>
                  <br />
                  <ul className="list-disc pl-6 flex flex-col gap-1">
                     <li>제공 받는 곳: GO-Ti</li>
                     <li>처리 목적: 오픈뱅킹 서비스(출금이체, 입금이체, 잔액조회 등) 제공</li>
                     <li>처리하는 개인정보 항목: 이름, 생년월일, 휴대전화번호, 금융기관명 및 계좌번호, 암호화된 동일인 식별정보(CI), 이메일</li>
                     <li>보유기간: 계좌 조회 서비스 제공 및 출금동의 확인 목적을 달성할 때까지 (관련법령에 따라 보존할 필요가 있는 경우는 해당 보존 기간)</li>
                  </ul>
                  <br />
                  <p className="font-bold">동의를 거부할 권리 및 동의를 거부할 경우의 불이익</p>
                  <p>이용자는 본 수집·이용에 대하여 거부할 권리가 있습니다. 이 동의는 "오픈뱅킹 서비스" 이용을 위한 필수적인 동의이므로, 동의를 하지 않으면 해당 서비스 이용에 제한이 있을 수 있습니다.</p>
                  <br />
                  <p className="font-bold">제공 및 변경에 관한 세부사항</p>
                  <p>금융결제원 오픈뱅킹공동업무 홈페이지: https://www.open-platform.or.kr</p>
               </div>
               <div className="px-6 pb-6 pt-4 shrink-0">
                  <button
                     onClick={onClose}
                     className="w-full bg-primary text-white text-body-1-bold rounded-lg px-6 py-3 hover:bg-primary-strong transition-colors"
                  >
                     확인
                  </button>
               </div>
            </DialogContent>
         </Dialog>

         <Dialog open={termsDialog === 'personalInfo'} onOpenChange={onClose}>
            <DialogContent maxWidth={600} showCloseButton={true} className="rounded-2xl p-0 gap-0 flex flex-col max-h-[80vh]">
               <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
                  <p className="text-heading-4-bold text-foreground">[출금이체] 개인정보 수집‧이용 동의(필수)</p>
               </div>
               <div className="overflow-y-auto px-6 py-4 text-body-2-regular text-foreground leading-relaxed flex-1">
                  <p>GoTi는 회원의 취소/환불 대금 지급을 위한 계좌 등록 및 송금 처리를 위하여 아래와 같이 개인정보를 수집∙이용하는 데 동의를 받고자 합니다. 내용을 자세히 읽으신 후 동의 여부를 결정하여 주십시오.</p>
                  <br />
                  <p className="font-bold">수집‧이용 목적</p>
                  <p>GoTi는 결제를 위한 회원의 출금이체 계좌등록 및 출금이체 처리</p>
                  <br />
                  <p className="font-bold">수집하려는 개인정보의 항목</p>
                  <p>이름, 생년월일, 휴대폰번호, 은행명, 계좌번호, 예금주명</p>
                  <br />
                  <p className="font-bold">보유·이용기간</p>
                  <p>5년</p>
                  <br />
                  <p>※ 위의 개인정보 수집‧이용에 대한 동의를 거부할 권리가 있습니다. 그러나, 동의를 거부할 경우 환불 계좌 등록 및 환불금 지급 처리에 제한을 받을 수 있습니다.</p>
                  <br />
                  <p className="font-bold">부칙</p>
                  <p>본 약관은 2019년 2월 21일부터 적용됩니다.</p>
               </div>
               <div className="px-6 pb-6 pt-4 shrink-0">
                  <button
                     onClick={onClose}
                     className="w-full bg-primary text-white text-body-1-bold rounded-lg px-6 py-3 hover:bg-primary-strong transition-colors"
                  >
                     확인
                  </button>
               </div>
            </DialogContent>
         </Dialog>
      </>
   );
}
