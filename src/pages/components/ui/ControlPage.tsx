import { Checkbox } from '@/shared/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';

const ControlPage = () => {
   return (
      <div className="flex flex-col gap-12 p-8 bg-white">
         {/* Checkbox Section */}
         <div className="flex flex-col gap-8">
            <h1 className="text-heading-2-bold">Checkbox</h1>

            <section className="flex flex-col gap-4">
               <h2 className="text-heading-4-medium">Size</h2>
               <div className="flex items-center gap-6">
                  <Checkbox size="lg" label="Large" />
                  <Checkbox size="md" label="Medium" />
               </div>
            </section>

            <section className="flex flex-col gap-4">
               <h2 className="text-heading-4-medium">Typography</h2>
               <div className="flex items-center gap-6">
                  <Checkbox typography="body1Medium" label="Body 1 Medium" />
                  <Checkbox typography="body2Regular" label="Body 2 Regular (default)" />
                  <Checkbox typography="body2Medium" label="Body 2 Medium" />
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

         {/* Radio Section */}
         <div className="flex flex-col gap-8">
            <h1 className="text-heading-2-bold">Radio</h1>

            <section className="flex flex-col gap-4">
               <h2 className="text-heading-4-medium">Size</h2>
               <RadioGroup defaultValue="large" className="flex items-center gap-6">
                  <RadioGroupItem value="large" size="lg" label="Large" />
                  <RadioGroupItem value="medium" size="md" label="Medium" />
               </RadioGroup>
            </section>

            <section className="flex flex-col gap-4">
               <h2 className="text-heading-5-medium">Typography</h2>
               <RadioGroup defaultValue="medium" className="flex items-center gap-6">
                  <RadioGroupItem value="medium" typography="body1Medium" label="Body 2 Medium" />
               </RadioGroup>
            </section>

            <section className="flex flex-col gap-4">
               <h2 className="text-heading-4-medium">States</h2>
               <RadioGroup defaultValue="checked" className="flex items-center gap-6">
                  <RadioGroupItem value="normal" label="Normal" />
                  <RadioGroupItem value="checked" label="Checked" />
                  <RadioGroupItem value="disabled" disabled label="Disabled" />
               </RadioGroup>
            </section>

            <section className="flex flex-col gap-4">
               <h2 className="text-heading-5-medium">Disabled Checked</h2>
               <RadioGroup defaultValue="disabled-checked" className="flex items-center gap-6">
                  <RadioGroupItem value="disabled-checked" disabled label="Disabled Checked" />
               </RadioGroup>
            </section>
         </div>
      </div>
   );
};

export default ControlPage;
