import { Alert } from '@/shared/ui/alert';

const AlertPage = () => {
   return (
      <div className="flex flex-col gap-12 p-8 bg-white">
         <div className="flex flex-col gap-8">
            <h1 className="text-heading-2-bold">Alert</h1>

            <section className="flex flex-col gap-4">
               <h2 className="text-heading-4-medium">Default (No Icon)</h2>
               <Alert>Alert message</Alert>
            </section>

            <section className="flex flex-col gap-4">
               <h2 className="text-heading-4-medium">Success</h2>
               <Alert variant="success">Successfully saved!</Alert>
            </section>

            <section className="flex flex-col gap-4">
               <h2 className="text-heading-4-medium">Fail</h2>
               <Alert variant="fail">Something went wrong.</Alert>
            </section>
         </div>
      </div>
   );
};

export default AlertPage;
