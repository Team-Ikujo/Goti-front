import { teams } from '@/entities/team/model/teams';
import type { Team } from '@/entities/team/model/types';
import { X } from 'lucide-react';

type TeamSelectModalProps = {
   open: boolean;
   onClose: () => void;
   onSelectTeam: (team: Team) => void;
};

const TeamSelectModal = ({ open, onClose, onSelectTeam }: TeamSelectModalProps) => {
   if (!open) return null;

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
         <div
            className="bg-white rounded-2xl w-full max-w-[660px] mx-4 p-8 flex flex-col gap-6"
            onClick={e => e.stopPropagation()}
         >
            <div className="flex items-center justify-between">
               <h2 className="text-[22px] font-bold text-foreground">좋아하는 팀을 선택하세요</h2>
               <button
                  onClick={onClose}
                  className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 transition-colors"
               >
                  <X className="size-5 text-foreground" />
               </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
               {teams.filter(team => team.id === 'samsung' || team.id === 'kia').map(team => (
                  <button
                     key={team.id}
                     type="button"
                     disabled={!team.isEnabled}
                     onClick={() => {
                        onSelectTeam(team);
                        onClose();
                     }}
                     className="flex items-center gap-4 px-5 py-4 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] transition-colors enabled:hover:border-primary enabled:hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                     <div className="size-10 shrink-0">
                        <img src={team.logoSrc} alt={team.name} className="size-full object-contain" />
                     </div>
                     <span className="text-[16px] font-semibold text-foreground">{team.name}</span>
                  </button>
               ))}
            </div>
         </div>
      </div>
   );
};

export default TeamSelectModal;
