import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
   extend: {
      classGroups: {
         'font-size': [
            {
               text: [
                  'display-1-bold', 'display-1-medium',
                  'title-1-bold', 'title-1-medium', 'title-1-regular',
                  'title-2-bold', 'title-2-medium', 'title-2-regular',
                  'heading-1-bold', 'heading-1-semibold', 'heading-1-medium', 'heading-1-regular',
                  'heading-2-bold', 'heading-2-semibold', 'heading-2-medium', 'heading-2-regular',
                  'heading-3-bold', 'heading-3-semibold', 'heading-3-medium', 'heading-3-regular',
                  'body-1-bold', 'body-1-semibold', 'body-1-medium', 'body-1-regular',
                  'body-2-bold', 'body-2-semibold', 'body-2-medium', 'body-2-regular',
                  'body-3-bold', 'body-3-semibold', 'body-3-medium', 'body-3-regular',
                  'label-1-bold', 'label-1-semibold', 'label-1-medium', 'label-1-regular',
                  'label-2-bold', 'label-2-semibold', 'label-2-medium', 'label-2-regular',
                  'label-3-bold', 'label-3-semibold', 'label-3-medium', 'label-3-regular',
                  'caption-1-bold', 'caption-1-medium', 'caption-1-regular',
                  'caption-2-bold', 'caption-2-medium', 'caption-2-regular',
               ],
            },
         ],
      },
   },
});

export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs));
}
