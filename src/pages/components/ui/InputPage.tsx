import { Input } from '@/shared/ui/input';

const InputPage = () => {
   return (
      <div className="flex flex-col gap-8 p-8 bg-white max-w-md">
         {/* Enabled */}
         <Input label="Label" required placeholder="Placeholder" helpText="Help text" />

         {/* Entered */}
         <Input label="Label" required defaultValue="Placeholder" helpText="Help text" />

         {/* Disabled */}
         <Input label="Label" required placeholder="Placeholder" helpText="Help text" disabled />

         {/* Error (Enabled) */}
         <Input label="Label" required placeholder="Placeholder" helpText="Help text" error />

         {/* Error (Entered) */}
         <Input label="Label" required defaultValue="Placeholder" helpText="Help text" error />
      </div>
   );
};

export default InputPage;
