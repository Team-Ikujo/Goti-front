export type AgreementType = 'verification' | 'signup';

export type TermAgreementCode =
   | 'service_terms'
   | 'privacy_policy'
   | 'identity_verification_terms'
   | 'third_party_sharing'
   | 'marketing_opt_in';

export type TermSignUpCode =
   | 'personal_information'
   | 'unique_Identification'
   | 'Identification_service'
   | 'carrier_terms_conditions'
   | 'order_14_years';

export type TermCode = TermAgreementCode | TermSignUpCode;

export type TermsAgreement = {
   id: number;
   code: TermAgreementCode;
   label: string;
   required: boolean;
   sortOrder: number;
   hasDetail: boolean;
};
export type TermsSignUp = {
   id: number;
   code: TermSignUpCode;
   label: string;
   required: boolean;
   sortOrder: number;
   hasDetail: boolean;
};

export type TermsAgreementDetail = {
   code: TermAgreementCode;
   title: string;
   summary: string;
   scopeTitle: string;
   purpose: string;
   fields: string;
   retention: string;
   collector: string;
   footerNote: string;
};
export type TermsSignUpDetail = {
   code: TermSignUpCode;
   title: string;
   summary: string;
   scopeTitle: string;
   purpose: string;
   fields: string;
   retention: string;
   collector: string;
   footerNote: string;
};

export type TermsDetail = TermsAgreementDetail | TermsSignUpDetail;
