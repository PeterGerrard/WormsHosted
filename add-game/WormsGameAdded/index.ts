import { AzureFunction, Context } from "@azure/functions";

type PlayerPosition = {
  player: string;
  position: number;
};

type GameData = {
  playerPositions: PlayerPosition[];
};

type LeaderboardPlayer = {
  player: string;
  score: number;
};

type Leaderboard = {
  leaderboard: LeaderboardPlayer[];
};

const baseScore = 1000;
const maxRatingChange = 64;
const maxSkillGap = 400;

const addMissingPlayers = (
  leaderboardPlayers: LeaderboardPlayer[],
  gamePlayers: PlayerPosition[]
): LeaderboardPlayer[] => {
  const existingPlayers = leaderboardPlayers.map((p) => p.player);
  const currentPlayers = gamePlayers.map((p) => p.player);

  const newPlayers = currentPlayers.filter((p) => !existingPlayers.includes(p));

  return [
    ...leaderboardPlayers,
    ...newPlayers.map((n) => ({ player: n, score: baseScore })),
  ];
};

const getCurrentScore = (
  gamePlayer: PlayerPosition,
  leaderboardPlayers: LeaderboardPlayer[]
) => ({
  ...gamePlayer,
  score: leaderboardPlayers.filter((x) => x.player == gamePlayer.player)[0]
    .score,
});

const chanceOfWinning = (scoreA: number, scoreB: number) => {
  return 1 / (1 + Math.pow(10.0, (scoreB - scoreA) / maxSkillGap));
};

const ratingChange = (
  chanceOfWinning: number,
  won: boolean,
  totalPlayers: number
): number =>
  (won ? 1 : -1) *
  Math.floor(
    (maxRatingChange * (won ? 1 - chanceOfWinning : chanceOfWinning)) /
      (totalPlayers - 1)
  );

const getUpdatedScores = (
  gamePlayers: (PlayerPosition & LeaderboardPlayer)[]
) => {
  return gamePlayers.map((playerA) => {
    const adjustments = gamePlayers.map((playerB) => {
      if (playerA === playerB || playerA.position === playerB.position) {
        return 0;
      }

      const aWon = playerA.position < playerB.position;
      return ratingChange(
        chanceOfWinning(playerA.score, playerB.score),
        aWon,
        gamePlayers.length
      );
    });

    return {
      player: playerA.player,
      score: adjustments.reduce((x, y) => x + y, playerA.score),
    };
  });
};

const blobTrigger: AzureFunction = async (
  context: Context,
  myBlob: Buffer,
  leaderboard: Leaderboard
): Promise<void> => {
  const gameData: GameData = JSON.parse(myBlob.toString());

  const previousLeaderboard = addMissingPlayers(
    leaderboard.leaderboard,
    gameData.playerPositions
  );

  const gameInputs = gameData.playerPositions.map((p) =>
    getCurrentScore(p, previousLeaderboard)
  );
  const gameOutputs = getUpdatedScores(gameInputs);

  const updatedLeaderboard: Leaderboard = {
    leaderboard: previousLeaderboard
      .filter(
        (p) => !gameData.playerPositions.map((a) => a.player).includes(p.player)
      )
      .concat(gameOutputs),
  };
  context.bindings.leaderboardOutputBlob = updatedLeaderboard;
};

export default blobTrigger;
