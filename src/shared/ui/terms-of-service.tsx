import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Checkbox } from '@/shared/ui/checkbox';
import { Field, FieldGroup } from '@/shared/ui/field';
import { Label } from '@/shared/ui/label';

interface TermsCheckboxProps {
   id?: string;
   label: string;
   checked?: boolean;
   onChange?: (checked: boolean) => void;
   iconSrc?: {
      default: string;
      active: string;
   };
}

interface TermsSubItemProps {
   id?: string;
   label: string;
   checked?: boolean;
   onChange?: (checked: boolean) => void;
   showTrigger?: boolean;
   onTrigger?: () => void;
}

export const TermsSubItem = ({
   id = 'terms-subitem',
   label,
   checked,
   onChange,
   showTrigger = true,
   onTrigger,
}: TermsSubItemProps) => {
   return (
      <Field orientation="horizontal" className="items-center gap-0  min-h-11">
         <div className="flex flex-1 items-center px-4 py-2.5">
            <Checkbox
               id={id}
               name={id}
               size="md"
               typography="body2Regular"
               label={label}
               checked={checked}
               onCheckedChange={onChange}
            />
         </div>
         {showTrigger && (
            <button type="button" className="flex items-center justify-center p-2 w-11 h-11" onClick={onTrigger}>
               <ChevronRight className="size-4 text-muted-foreground" />
            </button>
         )}
      </Field>
   );
};

export const TermsCheckbox = ({ id = 'terms-checkbox', label, checked, onChange }: TermsCheckboxProps) => {
   return (
      <FieldGroup className="bg-surface  rounded-lg">
         <Field orientation="horizontal" className="justify-between w-full">
            <div className="flex  flex-1 items-center gap-2 px-4 py-3">
               <Checkbox id={id} name={id} checked={checked} onCheckedChange={onChange} />
               <Label htmlFor={id}>{label}</Label>
            </div>
         </Field>
      </FieldGroup>
   );
};
