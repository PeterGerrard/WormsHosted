export type PlayerPosition = {
  player: string;
  position: number;
};

export type GameData = {
  playerPositions: PlayerPosition[];
};

export type LeaderboardPlayer = {
  player: string;
  score: number;
};

export type Leaderboard = {
  leaderboard: LeaderboardPlayer[];
};
