// src/entities/user/model/useMyProfile.ts

import { useMemo } from 'react';
import { useAuthStore } from '@/entities/auth/model/authStore';
import type { MemberProfile } from '../api/memberApi';

/** JWT payload를 base64url 디코딩해서 반환 */
const decodeJwt = (token: string): Record<string, unknown> | null => {
   try {
      const part = token.split('.')[1];
      if (!part) return null;
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64)) as Record<string, unknown>;
   } catch {
      return null;
   }
};

export const useMyProfile = (): { data: MemberProfile | undefined } => {
   const accessToken = useAuthStore(s => s.accessToken);

   const data = useMemo<MemberProfile | undefined>(() => {
      if (!accessToken) return undefined;
      const payload = decodeJwt(accessToken);
      if (!payload) return undefined;
      return {
         name: typeof payload.name === 'string' ? payload.name : undefined,
         mobile: typeof payload.mobile === 'string' ? payload.mobile : undefined,
      } as MemberProfile;
   }, [accessToken]);

   return { data };
};
