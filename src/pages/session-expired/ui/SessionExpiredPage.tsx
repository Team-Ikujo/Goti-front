// src/pages/session-expired/ui/SessionExpiredPage.tsx

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/entities/auth/model/authStore';

const SessionExpiredPage = () => {
   const navigate = useNavigate();
   const clearLogoutReason = useAuthStore(state => state.clearLogoutReason);

   const handleGoLogin = () => {
      clearLogoutReason();
      navigate('/auth/login', { replace: true });
   };

   return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
         <div className="flex flex-col items-center gap-3 py-10">
            <h1 className="text-[24px] font-bold text-[#161d24]">자동 로그아웃 되었어요</h1>
            <p className="text-[14px] font-normal text-[#374553] text-center">
               안전한 고객 정보 보호를 위해 60분 동안 서비스 이용이 없는 경우 자동으로 로그아웃됩니다.
            </p>
         </div>
         <button
            type="button"
            onClick={handleGoLogin}
            className="w-full max-w-[380px] h-12 rounded-[8px] bg-[#2563eb] text-[16px] font-bold text-white hover:bg-[#1d4ed8] transition-colors"
         >
            로그인 하러가기
         </button>
      </div>
   );
};

export default SessionExpiredPage;
