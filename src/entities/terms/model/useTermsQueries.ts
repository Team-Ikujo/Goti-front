import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchTermDetail, fetchTermsAgreementList } from '../api/terms';
import type { AgreementType, TermCode, TermsAgreement, TermsSignUp } from './types';

export type { AgreementType };

const TERMS_QUERY_KEYS = {
   all: ['terms'] as const,
   list: (type: AgreementType = 'verification') => [...TERMS_QUERY_KEYS.all, 'list', type] as const,
   detail: (code: TermCode | null) => [...TERMS_QUERY_KEYS.all, 'detail', code] as const,
};

// Function overloads for type safety based on the agreement type
export function useTermsAgreementListQuery(type: 'verification'): UseQueryResult<TermsAgreement[], Error>;
export function useTermsAgreementListQuery(type: 'signup'): UseQueryResult<TermsSignUp[], Error>;
export function useTermsAgreementListQuery(type?: 'verification'): UseQueryResult<TermsAgreement[], Error>;

export function useTermsAgreementListQuery(type: AgreementType = 'verification') {
   return useQuery({
      queryKey: TERMS_QUERY_KEYS.list(type),
      // The `fetchTermsAgreementList` is expected to return an array of terms.
      // The overloads above will correctly type the `data` property of the query result.
      queryFn: () => fetchTermsAgreementList(type) as Promise<any>,
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 30,
   });
}

export const useTermDetailQuery = (code: TermCode | null) => {
   return useQuery({
      queryKey: TERMS_QUERY_KEYS.detail(code),
      queryFn: () => fetchTermDetail(code!),
      enabled: Boolean(code),
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 30,
   });
};
