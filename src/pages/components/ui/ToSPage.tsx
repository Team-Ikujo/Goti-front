import { useState } from 'react';
import { TermsCheckbox, TermsSubItem } from '@/shared/ui/terms-of-service';

const ToSPage = () => {
   const [isChecked, setIsChecked] = useState(false);
   const [subItem1, setSubItem1] = useState(false);
   const [subItem2, setSubItem2] = useState(false);

   const handleAllCheck = (checked: boolean) => {
      setIsChecked(checked);
      setSubItem1(checked);
      setSubItem2(checked);
   };

   const handleSubItem1Change = (checked: boolean) => {
      setSubItem1(checked);
      setIsChecked(checked && subItem2);
   };

   const handleSubItem2Change = (checked: boolean) => {
      setSubItem2(checked);
      setIsChecked(checked && subItem1);
   };

   return (
      <div className="flex flex-col gap-4 p-8 bg-white">
         <TermsCheckbox id="terms" label="Label" checked={isChecked} onChange={handleAllCheck} />
         <TermsSubItem
            id="sub-item-1"
            label="Label"
            checked={subItem1}
            onChange={handleSubItem1Change}
            onTrigger={() => console.log('상세보기 클릭')}
         />
         <TermsSubItem
            id="sub-item-2"
            label="Label"
            checked={subItem2}
            onChange={handleSubItem2Change}
            showTrigger={false}
         />
      </div>
   );
};

export default ToSPage;
