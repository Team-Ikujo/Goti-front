import { Button } from '@/shared/ui/button';
import { ArrowRightIcon, PlusIcon, SearchIcon, DownloadIcon } from 'lucide-react';

const ButtonPage = () => {
   return (
      <div className="flex flex-col gap-6 p-6 bg-white">
         {/* 기본 버튼 */}
         <div className="flex gap-4">
            <Button variant="primary">Primary 버튼</Button>
            <Button variant="primary" disabled>
               Primary 버튼
            </Button>
            <Button variant="outline">Outline 버튼</Button>
            <Button variant="outline" disabled>
               Outline 버튼
            </Button>
         </div>

         {/* 왼쪽 아이콘 버튼 */}
         <div className="flex gap-2">
            <Button variant="primary">
               <PlusIcon /> 버튼
            </Button>
            <Button variant="outline">
               <SearchIcon /> 버튼
            </Button>
         </div>

         {/* 오른쪽 아이콘 버튼 */}
         <div className="flex gap-2">
            <Button variant="primary">
               버튼 <ArrowRightIcon />
            </Button>
            <Button variant="outline">
               버튼 <DownloadIcon />
            </Button>
         </div>
      </div>
   );
};

export default ButtonPage;
