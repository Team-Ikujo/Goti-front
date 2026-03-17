import { teams } from '@/entities/team/model/teams';
import { cn } from '@/shared/lib/utils';

import { TEAM_IDS, teamLogos, teamOrder } from './constants';

type TeamLogoNavProps = {
   onNavigateTeam: (teamId: string) => void;
};

function TeamLogoNav({ onNavigateTeam }: TeamLogoNavProps) {
   return (
      <div className="flex gap-10">
         {teamOrder
            .filter(team => team === '삼성' || team === 'KIA')
            .map(team => {
               const teamId = TEAM_IDS[team];
               const isEnabled = teams.find(candidate => candidate.id === teamId)?.isEnabled ?? false;

               return (
                  <button
                     key={team}
                     onClick={() => isEnabled && onNavigateTeam(teamId)}
                     disabled={!isEnabled}
                     className={cn(
                        'aspect-square min-h-14 max-h-25 min-w-15] p-1.25 lg:p-2.5 flexitems-center justify-center overflow-hidden transition-colors rounded-none lg:rounded-xl',
                        isEnabled ? 'hover:bg-fill-hoveraccent cursor-pointer' : 'null',
                     )}
                  >
                     <img src={teamLogos[team]} alt={team} className="h-full object-contain" />
                  </button>
               );
            })}
      </div>
   );
}

export default TeamLogoNav;
