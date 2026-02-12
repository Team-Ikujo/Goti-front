import { useQuery } from "@tanstack/react-query";
import { fetchTermDetail, fetchTermsAgreementList } from "../api/terms";
import type { TermCode } from "./types";

const TERMS_QUERY_KEYS = {
  all: ["terms"] as const,
  list: () => [...TERMS_QUERY_KEYS.all, "list"] as const,
  detail: (code: TermCode | null) => [...TERMS_QUERY_KEYS.all, "detail", code] as const,
};

export const useTermsAgreementListQuery = () => {
  return useQuery({
    queryKey: TERMS_QUERY_KEYS.list(),
    queryFn: fetchTermsAgreementList,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
};

export const useTermDetailQuery = (code: TermCode | null) => {
  return useQuery({
    queryKey: TERMS_QUERY_KEYS.detail(code),
    queryFn: () => fetchTermDetail(code as TermCode),
    enabled: Boolean(code),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
};
