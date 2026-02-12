import { Tooltip } from '@/shared/ui/tooltip';

const TooltipPage = () => {
   return (
      <div className="flex items-center gap-12 p-8 bg-white">
         <Tooltip arrow="top">Description</Tooltip>
         <Tooltip arrow="bottom">Description</Tooltip>
         <Tooltip arrow="left">Description</Tooltip>
         <Tooltip arrow="right">Description</Tooltip>
      </div>
   );
};

export default TooltipPage;
