export interface DBParticipant {
  id: number;
  first_name: string;
  family_name: string;
  username: string;
  discord_username: string;
  discord_id: string;
  is_staff: number;
  is_donator: number;
  points: number;
}

export interface DBTeam {
  id: number;
  name: string;
  creator: number;
  tournament_id: number;
  rank: number | null;
  confirmed: number;
}

export interface DBTournament {
  id: number;
  name: string;
  team_size: number;
  state: string;
  format1: string;
  format2: string | null;
  current: number | null;
  extra: string | null;
}

export interface DBMatch {
  id: number;
  tournament_id: number;
  tournament_stage: number;
  teams: string | null;
  score: string | null;
  next_winner: number | null;
  next_loser: number | null;
}
