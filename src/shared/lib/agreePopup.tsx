import { KeyValueTable } from '@/shared/ui/table';

export const TERMS_DATA = {
   service: {
      title: '서비스 이용약관',
      content: '서비스 이용약관 본문 내용입니다...',
      button: 'label',
   },
   privacy: {
      title: '개인정보 수집 • 이용 동의',
      content: (
         <div className="flex flex-col gap-4 text-body-2-regular leading-relaxed text-foreground border rounded-lg p-4">
            <p>
               개인정보보호법 제 15조, 제 17조, 제 24조에 따라 귀하의 개인정보를 수집•이용 등을 처리하고자 합니다.
               <br />
               귀하는 아래 내용을 동의하지 않을 수 없으며, 동의하지 않을 경우 자료 불충분으로 서비스 신청이 거절될 수
               있습니다.
            </p>

            <p>개인정보 수집 • 이용에 관한 동의</p>
            <KeyValueTable
               rows={[
                  { label: '수집∙이용 목적', value: '관리자 페이지 접근 권한 부여' },
                  { label: '수집하는 개인정보 항목', value: '담당자 식별정보, 부서명, 직위, 성명, 전화번호, 이메일' },
                  { label: '보유∙이용하는 기간', value: '개인정보의 수집•이용 동의일부터 계약종료일' },
                  { label: '수집∙이용하는 자', value: 'GoTi, 각 구단, KBO' },
               ]}
            />

            <p className="text-muted-foreground">
               ※ 위 사항에 대하여 설명 받고 이해하였으며, GoTi가 위 개인 정보를 수집•이용 하는 것에 대해 동의합니다.
            </p>
         </div>
      ),
      button: '동의 후 닫기',
   },
   identity: {
      title: '본인 인증 서비스 이용 동의',
      content: '본인 인증 서비스 이용 동의 본문 내용입니다...',
      button: 'label',
   },
   thirdParty: {
      title: '개인정보 제3자 제공 동의',
      content: '제3자 제공 동의 본문 내용입니다...',
      button: 'label',
   },
};
