// src/shared/widgets/layout/mypage/MypageLayout.tsx

import Header from '@/shared/widgets/layout/auth/Header';
import Footer from '@/shared/widgets/layout/home/Footer';
import { Outlet } from 'react-router-dom';

const MypageLayout = () => {
   return (
      <div className="min-h-screen flex flex-col bg-white">
         <Header />
         <main className="flex flex-1 flex-col">
            <Outlet />
         </main>
         <Footer />
      </div>
   );
};

export default MypageLayout;
