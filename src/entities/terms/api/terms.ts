import apiClient from "@/shared/api/client";
import type { TermCode, TermsAgreement, TermsDetail } from "../model/types";

type TermsAgreementListResponse = {
  items: TermsAgreement[];
};

type TermDetailResponse = {
  item: TermsDetail | null;
};

export const fetchTermsAgreementList = async (): Promise<TermsAgreement[]> => {
  const { data } = await apiClient.get<TermsAgreementListResponse>(
    "/api/v1/terms",
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
