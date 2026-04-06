// src/entities/user/model/useMyProfile.ts

import { useMemo } from 'react';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { resolveProfileFromJwt } from '@/shared/lib/jwt';
import type { MemberProfile } from '../api/memberApi';

export const useMyProfile = (): { data: MemberProfile | undefined } => {
   const accessToken = useAuthStore(s => s.accessToken);

   const data = useMemo<MemberProfile | undefined>(() => {
      if (!accessToken) return undefined;

      const profile = resolveProfileFromJwt(accessToken);

      if (!profile) {
         return undefined;
      }

      return profile;
   }, [accessToken]);

   return { data };
};
