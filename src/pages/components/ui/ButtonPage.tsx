import { Button } from '@/shared/ui/button';
import { ArrowRightIcon, PlusIcon, SearchIcon, DownloadIcon } from 'lucide-react';

const ButtonPage = () => {
   return (
      <div className="flex flex-col gap-6 p-6 bg-white">
         {/* 기본 버튼 */}
         <div className="flex gap-4">
            <Button variant="primary">Label</Button>
            <Button variant="primary" disabled>
               Label
            </Button>
            <Button variant="outline">Label</Button>
            <Button variant="outline" disabled>
               Label
            </Button>
            <Button variant="primaryline">Label</Button>
            <Button variant="primaryline" disabled>
               Label
            </Button>
         </div>

         {/* 왼쪽 아이콘 버튼 */}
         <div className="flex gap-2">
            <Button variant="primary">
               <PlusIcon /> Label
            </Button>
            <Button variant="outline">
               <SearchIcon /> Label
            </Button>
         </div>

         {/* 오른쪽 아이콘 버튼 */}
         <div className="flex gap-2">
            <Button variant="primary">
               Label <ArrowRightIcon />
            </Button>
            <Button variant="outline">
               Label <DownloadIcon />
            </Button>
            <Button variant="primaryline">
               Label <DownloadIcon />
            </Button>
         </div>
      </div>
   );
};

export default ButtonPage;
