import Header from '@/shared/widgets/layout/auth/Header';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';

const HomeLayout = () => {
   return (
      <div className="min-h-screen flex flex-col bg-slate-950">
         <Header />
         <main className="flex flex-1 flex-col">
            <Outlet />
         </main>
         <Footer />
      </div>
   );
};

export default HomeLayout;
