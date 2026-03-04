const navLinks = ["이용약관", "개인정보처리방침", "이메일주소 무단수집거부", "고객센터", "공지사항", "Q&A"];

const Footer = () => {
  return (
    <footer className="bg-[#f1f2f4] border-t border-(--border-normal) w-full px-4 pt-5 pb-20">
      <div className="flex flex-col gap-10 max-w-[1200px] mx-auto w-full">

        {/* 상단 링크 */}
        <nav className="flex items-center h-[30px]">
          {navLinks.map((link, i) => (
            <span key={link} className="flex items-center">
              <span className="px-5 text-label-2-medium text-(--text-secondary) cursor-default">
                {link}
              </span>
              {i < navLinks.length - 1 && (
                <span className="w-px h-3.5 bg-(--border-normal)" />
              )}
            </span>
          ))}
        </nav>

        {/* 회사 정보 3단 */}
        <div className="flex items-start justify-between gap-6">
          {/* 사업자 정보 */}
          <div className="flex flex-col gap-2.5 flex-1">
            <p className="text-label-2-semibold text-(--text-secondary)">(주)고티</p>
            <div className="flex flex-col gap-1 text-caption-1-medium text-(--text-secondary)">
              <p>주소: 경기도 성남시 분당구 대왕판교로 660, 5층</p>
              <p>사업자등록번호: 210-87-45678</p>
              <p>통신판매업신고: 제2026-경기성남-12345호</p>
              <p>호스팅서비스제공자: 고티</p>
              <p>대표자: 류명재</p>
            </div>
          </div>

          {/* 고객센터 */}
          <div className="flex flex-col gap-2.5 flex-1">
            <p className="text-label-2-semibold text-(--text-secondary)">고객센터</p>
            <div className="flex flex-col gap-1 text-caption-1-medium text-(--text-secondary)">
              <p>티켓 고객센터 전화번호: 1544-3829</p>
              <p>팩스:</p>
              <p>지역번호:</p>
              <p>이메일</p>
              <p>티켓 1:1 문의</p>
            </div>
          </div>

          {/* 전자금융거래 */}
          <div className="flex flex-col gap-2.5 flex-1">
            <p className="text-label-2-semibold text-(--text-secondary)">전자금융거래 분쟁처리 담당정보</p>
            <div className="flex flex-col gap-1 text-caption-1-medium text-(--text-secondary)">
              <p>티켓 고객센터 전화번호: 1544-3829</p>
            </div>
          </div>
        </div>

        {/* 면책 문구 + 저작권 */}
        <div className="flex flex-col gap-0 text-caption-1-medium text-(--text-secondary) leading-[1.5]">
          <p>
            &apos;고티&apos;는 일부 상품의 통신판매중개자로서 통신판매의 당사자가 아니므로, 상품의 예약, 이용 및
            환불 등 거래에 관련된 의무와 책임은 판매자에게 있으며 &apos;고티&apos;는 일제 책임을 지지 않습니다.
          </p>
          <p>©Goti., Ltd. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
