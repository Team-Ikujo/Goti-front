import { Checkbox } from '@/shared/ui/checkbox';

const ControlPage = () => {
   return (
      <div className="flex flex-col gap-8 p-8 bg-white">
         <h1 className="text-heading-2-bold">Checkbox</h1>

         <section className="flex flex-col gap-4">
            <h2 className="text-heading-4-medium">Size</h2>
            <div className="flex items-center gap-6">
               <Checkbox size="lg" label="Large" />
               <Checkbox size="md" label="Medium (default)" />
               <Checkbox size="sm" label="Small" />
            </div>
         </section>

         <section className="flex flex-col gap-4">
            <h2 className="text-heading-4-medium">Typography</h2>
            <div className="flex items-center gap-6">
               <Checkbox typography="body1Medium" label="Body 1 Medium" />
               <Checkbox typography="body1Regular" label="Body 1 Regular (default)" />
            </div>
         </section>

         <section className="flex flex-col gap-4">
            <h2 className="text-heading-4-medium">States</h2>
            <div className="flex items-center gap-6">
               <Checkbox label="Normal" />
               <Checkbox defaultChecked label="Checked" />
               <Checkbox checked="indeterminate" label="Indeterminate" />
               <Checkbox disabled label="Disabled" />
            </div>
         </section>

         <section className="flex flex-col gap-4">
            <h2 className="text-heading-4-medium">Disabled States</h2>
            <div className="flex items-center gap-6">
               <Checkbox disabled label="Disabled Normal" />
               <Checkbox disabled defaultChecked label="Disabled Checked" />
               <Checkbox disabled checked="indeterminate" label="Disabled Indeterminate" />
            </div>
         </section>
      </div>
   );
};

export default ControlPage;
