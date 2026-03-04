import Header from '@/shared/widgets/layout/auth/Header';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';

const HomeLayout = () => {
   return (
      <div className="min-h-screen flex flex-col bg-slate-950">
         <Header />
         <main className="flex-1">
            <Outlet />
         </main>
         <Footer />
      </div>
   );
};

export default HomeLayout;
