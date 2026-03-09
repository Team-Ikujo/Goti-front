import { create } from 'zustand';
import type { Team } from './types';

type TeamState = {
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team | null) => void;
};

export const useTeamStore = create<TeamState>()((set) => ({
  selectedTeam: null,
  setSelectedTeam: (team) => set({ selectedTeam: team }),
}));
