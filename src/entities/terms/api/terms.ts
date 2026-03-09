import apiClient from "@/shared/api/client";
import type { AgreementType, TermCode, TermsAgreement, TermsDetail } from "../model/types";

type TermsAgreementListResponse = {
  items: TermsAgreement[];
};

type TermDetailResponse = {
  item: TermsDetail | null;
};

type Envelope<T> = {
  data: T;
};

export const fetchTermsAgreementList = async (type: AgreementType = 'verification'): Promise<TermsAgreement[]> => {
  const { data } = await apiClient.get<TermsAgreementListResponse | Envelope<TermsAgreementListResponse>>(
    "/api/v1/terms",
    { params: { type } },
  );
  const payload = "data" in data ? data.data : data;
  return payload.items ?? [];
};

export const fetchTermDetail = async (
  code: TermCode,
): Promise<TermsDetail | null> => {
  const { data } = await apiClient.get<TermDetailResponse | Envelope<TermDetailResponse>>(
    `/api/v1/terms/${code}`,
  );
  const payload = "data" in data ? data.data : data;
  return payload.item ?? null;
};
