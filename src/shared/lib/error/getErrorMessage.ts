import { ApiError } from '@/shared/api/client';

export const getErrorMessage = (error: unknown, fallbackMessage: string) => {
   if (error instanceof ApiError) {
      return error.message;
   }

   if (error instanceof Error && error.message) {
      return error.message;
   }

   return fallbackMessage;
};
