import { Alert } from '@/shared/ui/alert';

const AlertPage = () => {
   return (
      <div className="flex flex-col gap-12 p-8 bg-white">
         <div className="flex flex-col gap-8">
            <h1 className="text-heading-2-bold">Alert</h1>

            <section className="flex flex-col gap-4">
               <h2 className="text-heading-4-medium">Success</h2>
               <div className="flex flex-col gap-4">
                  <Alert>Successfully saved!</Alert>
               </div>
            </section>
         </div>
      </div>
   );
};

export default AlertPage;
