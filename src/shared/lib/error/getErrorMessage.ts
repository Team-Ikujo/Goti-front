import { ApiError } from '@/shared/api/client';

export const getErrorMessage = (error: unknown, fallbackMessage: string) => {
   if (error instanceof ApiError) {
      const normalizedMessage = error.message.trim().toLowerCase();

      // 백엔드 JWT 설정/인증 예외 문구는 사용자에게 그대로 노출하지 않는다.
      if (
         error.status === 401 ||
         error.status === 403 ||
         normalizedMessage.includes('rbac') ||
         normalizedMessage.includes('access denied') ||
         normalizedMessage.includes('jwt issuer') ||
         normalizedMessage.includes('issuer is not configured') ||
         normalizedMessage.includes('unauthorized') ||
         normalizedMessage.includes('forbidden')
      ) {
         return '로그인 정보를 확인할 수 없습니다. 다시 로그인한 뒤 시도해 주세요.';
      }

      return error.message;
   }

   if (error instanceof Error && error.message) {
      return error.message;
   }

   return fallbackMessage;
};
