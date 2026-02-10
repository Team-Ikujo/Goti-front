import { useState } from 'react';
import { Option } from '@/shared/ui/option';

const OptionPage = () => {
   const [selected, setSelected] = useState<string | null>(null);

   return (
      <div className="flex flex-col gap-12 p-8 bg-white">
         <div className="flex flex-col gap-8">
            <h1 className="text-heading-2-bold">Option</h1>

            <section className="flex flex-col gap-4">
               <h2 className="text-heading-4-medium">States</h2>
               <div className="flex items-center gap-4">
                  <Option active={selected === 'a'} onClick={() => setSelected('a')}>
                     Option A
                  </Option>
                  <Option active={selected === 'b'} onClick={() => setSelected('b')}>
                     Option B
                  </Option>
                  <Option active={selected === 'c'} onClick={() => setSelected('c')}>
                     Option C
                  </Option>
               </div>
            </section>
         </div>
      </div>
   );
};

export default OptionPage;
