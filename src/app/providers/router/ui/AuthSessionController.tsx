import { useEffect } from 'react';
import { useAuthStore } from '@/entities/auth/model/authStore';

const AuthSessionController = () => {
   const authExpiresAt = useAuthStore(state => state.authExpiresAt);
   const startAuthSessionTimer = useAuthStore(state => state.startAuthSessionTimer);
   const stopAuthSessionTimer = useAuthStore(state => state.stopAuthSessionTimer);
   const syncAuthSession = useAuthStore(state => state.syncAuthSession);

   useEffect(() => {
      syncAuthSession();
   }, [syncAuthSession]);

   useEffect(() => {
      if (authExpiresAt === null) {
         stopAuthSessionTimer();
         return;
      }

      startAuthSessionTimer();

      return () => {
         stopAuthSessionTimer();
      };
   }, [authExpiresAt, startAuthSessionTimer, stopAuthSessionTimer]);

   return null;
};

export default AuthSessionController;
