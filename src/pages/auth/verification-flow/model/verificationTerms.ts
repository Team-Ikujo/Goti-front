import type {
  TermAgreementCode,
  TermsAgreement,
  TermsAgreementDetail,
} from "@/entities/terms/model/types";

export const verificationTermsAgreements: TermsAgreement[] = [
  {
    id: 1,
    code: "service_terms",
    label: "(필수) 서비스 이용약관 동의",
    required: true,
    sortOrder: 1,
    hasDetail: true,
  },
  {
    id: 2,
    code: "privacy_policy",
    label: "(필수) 개인정보 처리 방침 동의",
    required: true,
    sortOrder: 2,
    hasDetail: true,
  },
  {
    id: 3,
    code: "identity_verification_terms",
    label: "(필수) 본인 인증 서비스 이용 동의",
    required: true,
    sortOrder: 3,
    hasDetail: true,
  },
  {
    id: 4,
    code: "third_party_sharing",
    label: "(필수) 개인정보 제3자 제공 동의",
    required: true,
    sortOrder: 4,
    hasDetail: true,
  },
  {
    id: 5,
    code: "marketing_opt_in",
    label: "(선택) 마케팅 정보 수신 동의",
    required: false,
    sortOrder: 5,
    hasDetail: true,
  },
];

export const verificationTermsDetailByCode: Record<
  TermAgreementCode,
  TermsAgreementDetail
> = {
  service_terms: {
    code: "service_terms",
    title: "서비스 이용약관 동의",
    summary:
      "서비스 이용을 위해 필요한 약관입니다. 동의하지 않으면 서비스 이용이 제한될 수 있습니다.",
    scopeTitle: "약관 적용 범위",
    purpose: "서비스 제공 및 운영",
    fields: "서비스 이용 기록, 접속 정보",
    retention: "회원 탈퇴 또는 관련 법령에 따른 보관 기간",
    collector: "BallX 운영사",
    footerNote: "※ 위 사항을 이해했으며, 서비스 이용약관에 동의합니다.",
  },
  privacy_policy: {
    code: "privacy_policy",
    title: "개인정보 수집·이용 동의",
    summary:
      "개인정보보호법 제15조, 제17조, 제24조에 따라 귀하의 개인정보를 수집·이용 등을 처리합니다. 귀하는 아래 내용을 동의하지 않을 수 없으며, 동의하지 않을 경우 자료 불충분으로 서비스 신청이 거절될 수 있습니다.",
    scopeTitle: "개인정보 수집 · 이용에 관한 동의",
    purpose: "관리자 페이지 접근 권한 부여",
    fields: "담당자 식별정보, 부서명, 직위, 성명, 전화번호, 이메일",
    retention: "개인정보의 수집·이용 동의일부터 계약종료일",
    collector: "GoTi, 각 구단, KBO",
    footerNote:
      "※ 위 사항에 대하여 설명 받고 이해하였으며, GoTi가 위 개인정보를 수집·이용하는 것에 대해 동의합니다.",
  },
  identity_verification_terms: {
    code: "identity_verification_terms",
    title: "본인인증 서비스 이용약관 동의",
    summary:
      "본인 확인 절차 진행을 위해 본인인증 서비스 이용약관 동의가 필요합니다.",
    scopeTitle: "약관 적용 범위",
    purpose: "본인 확인 및 부정 이용 방지",
    fields: "이름, 생년월일, 휴대폰 번호",
    retention: "인증 완료 후 관련 법령에 따른 기간",
    collector: "본인인증 서비스 제공자",
    footerNote:
      "※ 위 사항을 이해했으며, 본인인증 서비스 이용약관에 동의합니다.",
  },
  third_party_sharing: {
    code: "third_party_sharing",
    title: "개인정보 제3자 제공 동의",
    summary:
      "서비스 제공을 위해 필요한 범위 내에서 개인정보가 제3자에게 제공될 수 있습니다.",
    scopeTitle: "제3자 제공 안내",
    purpose: "티켓 서비스 제공 및 운영",
    fields: "이름, 연락처, 인증 정보",
    retention: "제공 목적 달성 시 또는 법령상 보관 기간",
    collector: "구단, 리그 운영 주체 등",
    footerNote:
      "※ 위 사항을 이해했으며, 개인정보 제3자 제공에 동의합니다.",
  },
  marketing_opt_in: {
    code: "marketing_opt_in",
    title: "마케팅 정보 수신 동의",
    summary:
      "이벤트, 프로모션, 혜택 안내를 위한 마케팅 정보 수신 동의 항목입니다.",
    scopeTitle: "마케팅 수신 안내",
    purpose: "이벤트/혜택 정보 제공",
    fields: "휴대폰 번호, 이메일",
    retention: "동의 철회 시까지",
    collector: "BallX 운영사",
    footerNote:
      "※ 선택 항목이며 동의하지 않아도 기본 서비스 이용은 가능합니다.",
  },
};
