import Header from '@/shared/widgets/layout/auth/Header';
import Footer from './Footer';
import BottomNav from './BottomNav';
import { Outlet } from 'react-router-dom';

const HomeLayout = () => {
   return (
      <div className="min-h-screen flex flex-col bg-slate-950">
         <Header />
         <main className="flex-1 pb-16 lg:pb-0">
            <Outlet />
         </main>
         <Footer />
         <BottomNav />
      </div>
   );
};

export default HomeLayout;
