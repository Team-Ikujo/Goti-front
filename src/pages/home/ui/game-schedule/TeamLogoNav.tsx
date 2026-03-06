import { teams } from '@/entities/team/model/teams';
import { cn } from '@/shared/lib/utils';

import { TEAM_IDS, teamLogos, teamOrder } from './constants';

type TeamLogoNavProps = {
  onNavigateTeam: (teamId: string) => void;
};

function TeamLogoNav({ onNavigateTeam }: TeamLogoNavProps) {
  return (
    <div className="flex items-center justify-between">
      {teamOrder.map((team) => {
        const teamId = TEAM_IDS[team];
        const isEnabled = teams.find((candidate) => candidate.id === teamId)?.isEnabled ?? false;

        return (
          <button
            key={team}
            onClick={() => isEnabled && onNavigateTeam(teamId)}
            disabled={!isEnabled}
            className={cn(
              'flex items-center justify-center size-[80px] p-[10px] rounded-xl transition-colors overflow-hidden',
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
