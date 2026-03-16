import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import BooksHeader from './BooksHeader';

const BooksLayout = () => {
   useEffect(() => {
      const handleWheel = (event: WheelEvent) => {
         if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
         }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
         if (!(event.ctrlKey || event.metaKey)) {
            return;
         }

         const blockedKeys = ['+', '-', '=', '_', '0'];
         if (blockedKeys.includes(event.key)) {
            event.preventDefault();
         }
      };

      const handleGesture = (event: Event) => {
         event.preventDefault();
      };

      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('gesturestart', handleGesture as EventListener, { passive: false });
      window.addEventListener('gesturechange', handleGesture as EventListener, { passive: false });

      return () => {
         window.removeEventListener('wheel', handleWheel);
         window.removeEventListener('keydown', handleKeyDown);
         window.removeEventListener('gesturestart', handleGesture as EventListener);
         window.removeEventListener('gesturechange', handleGesture as EventListener);
      };
   }, []);

   return (
      <div className="min-h-screen bg-background">
         <BooksHeader />
         <main className="min-h-[calc(100vh-140px)]">
            <Outlet />
         </main>
      </div>
   );
};

export default BooksLayout;
