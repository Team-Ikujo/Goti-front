import { Fragment } from 'react';

const navLinksTop = ['이용약관', '개인정보처리방침', '이메일주소 무단수집거부'];
const navLinksBottom = ['고객센터', '공지사항', 'Q&A'];
const navLinksAll = [...navLinksTop, ...navLinksBottom];

const Divider = () => <span className="text-border select-none">|</span>;

const Footer = () => {
   return (
      <footer className="w-full border-t bg-(--neutral-100) px-4 pt-5 pb-20">
         <div className="mx-auto w-full max-w-300 flex flex-col gap-10">

            {/* 상단 링크 */}
            <nav>
               {/* 모바일: 3+3 두 줄 */}
               <div className="flex flex-col gap-5 md:hidden">
                  <div className="flex items-center gap-2.5">
                     {navLinksTop.map((link, i) => (
                        <Fragment key={link}>
                           <span className="cursor-default whitespace-nowrap text-label-2-medium text-muted-foreground">
                              {link}
                           </span>
                           {i < navLinksTop.length - 1 && <Divider />}
                        </Fragment>
                     ))}
                  </div>
                  <div className="flex items-center gap-2.5">
                     {navLinksBottom.map((link, i) => (
                        <Fragment key={link}>
                           <span className="cursor-default whitespace-nowrap text-label-2-medium text-muted-foreground">
                              {link}
                           </span>
                           {i < navLinksBottom.length - 1 && <Divider />}
                        </Fragment>
                     ))}
                  </div>
               </div>

               {/* 데스크탑: 한 줄 */}
               <div className="hidden md:flex items-center justify-between">
                  {navLinksAll.map((link, i) => (
                     <Fragment key={link}>
                        <span className="cursor-default whitespace-nowrap px-5 text-label-2-medium text-muted-foreground">
                           {link}
                        </span>
                        {i < navLinksAll.length - 1 && <Divider />}
                     </Fragment>
                  ))}
               </div>
            </nav>

            {/* 회사 정보 — flex-wrap으로 자연스럽게 개행 */}
            <div className="flex flex-wrap gap-5">
               <div className="flex-1 min-w-44 flex flex-col gap-2.5">
                  <p className="text-label-2-semibold text-muted-foreground">(주)고티</p>
                  <div className="hidden md:flex flex-col gap-1 text-caption-1-medium text-muted-foreground">
                     <p>주소: 경기도 성남시 분당구 대왕판교로 660, 5층</p>
                     <p>사업자등록번호: 210-87-45678</p>
                     <p>통신판매업신고: 제2026-경기성남-12345호</p>
                     <p>호스팅서비스제공자: 고티</p>
                     <p>대표자: 류명재</p>
                  </div>
               </div>
               <div className="flex-1 min-w-44 flex flex-col gap-2.5">
                  <p className="text-label-2-semibold text-muted-foreground">고객센터</p>
                  <div className="hidden md:flex flex-col gap-1 text-caption-1-medium text-muted-foreground">
                     <p>티켓 고객센터 전화번호: 1544-3829</p>
                     <p>팩스:</p>
                     <p>지역번호:</p>
                     <p>이메일</p>
                     <p>티켓 1:1 문의</p>
                  </div>
               </div>
               <div className="flex-1 min-w-44 flex flex-col gap-2.5">
                  <p className="text-label-2-semibold text-muted-foreground">전자금융거래 분쟁처리 담당정보</p>
                  <div className="hidden md:flex flex-col gap-1 text-caption-1-medium text-muted-foreground">
                     <p>티켓 고객센터 전화번호: 1544-3829</p>
                  </div>
               </div>
            </div>

            {/* 면책 문구 + 저작권 */}
            <div className="flex flex-col gap-2 text-caption-1-medium text-muted-foreground">
               <p>
                  '고티'는 일부 상품의 통신판매중개자로서 통신판매의 당사자가 아니므로, 상품의 예약, 이용 및 환불 등
                  거래에 관련된 의무와 책임은 판매자에게 있으며 '고티'는 일제 책임을 지지 않습니다.
               </p>
               <p>©Goti., Ltd. All rights reserved.</p>
            </div>

         </div>
      </footer>
   );
};

export default Footer;
