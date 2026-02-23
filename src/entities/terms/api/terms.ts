import apiClient from "@/shared/api/client";
import type { AgreementType, TermCode, TermsAgreement, TermsDetail } from "../model/types";

type TermsAgreementListResponse = {
  items: TermsAgreement[];
};

type TermDetailResponse = {
  item: TermsDetail | null;
};

export const fetchTermsAgreementList = async (type: AgreementType = 'verification'): Promise<TermsAgreement[]> => {
  const { data } = await apiClient.get<TermsAgreementListResponse>(
    "/api/v1/terms",
    { params: { type } },
  );
  return data.items;
};

export const fetchTermDetail = async (
  code: TermCode,
): Promise<TermsDetail | null> => {
  const { data } = await apiClient.get<TermDetailResponse>(
    `/api/v1/terms/${code}`,
  );
  return data.item;
};
