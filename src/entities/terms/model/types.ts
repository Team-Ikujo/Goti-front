export type TermCode =
  | "service_terms"
  | "privacy_policy"
  | "identity_verification_terms"
  | "third_party_sharing"
  | "marketing_opt_in";

export type TermsAgreement = {
  id: number;
  code: TermCode;
  label: string;
  required: boolean;
  sortOrder: number;
  hasDetail: boolean;
};

export type TermsDetail = {
  code: TermCode;
  title: string;
  summary: string;
  scopeTitle: string;
  purpose: string;
  fields: string;
  retention: string;
  collector: string;
  footerNote: string;
};
