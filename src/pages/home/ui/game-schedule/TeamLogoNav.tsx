import { teams } from '@/entities/team/model/teams';
import { cn } from '@/shared/lib/utils';

import { TEAM_IDS, teamLogos, teamOrder } from './constants';

type TeamLogoNavProps = {
  onNavigateTeam: (teamId: string) => void;
};

function TeamLogoNav({ onNavigateTeam }: TeamLogoNavProps) {
  return (
    <div className="grid grid-cols-5 gap-y-[10px] w-full lg:grid-cols-10 lg:gap-y-0">
      {teamOrder.map((team) => {
        const teamId = TEAM_IDS[team];
        const isEnabled = teams.find((candidate) => candidate.id === teamId)?.isEnabled ?? false;

        return (
          <button
            key={team}
            onClick={() => isEnabled && onNavigateTeam(teamId)}
            disabled={!isEnabled}
            className={cn(
              'aspect-square min-h-[60px] max-h-[100px] min-w-[60px] w-full p-[5px] lg:p-[10px] flex items-center justify-center overflow-hidden transition-colors rounded-none lg:rounded-xl',
              isEnabled ? 'hover:bg-fill-hoveraccent cursor-pointer' : 'opacity-30 cursor-not-allowed',
            )}
          >
            <img src={teamLogos[team]} alt={team} className="w-full h-full object-contain" />
          </button>
        );
      })}
    </div>
  );
}

export default TeamLogoNav;
