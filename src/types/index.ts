export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';

export type GamePhase = 'setup' | 'playing';

export type RoundPhase = 'bidding' | 'in_progress' | 'completed';

export interface Player {
  id: string;
  name: string;
  avatar: string;
}

export interface PlayerRoundData {
  playerId: string;
  bid: number;
  result: number | null;
  score: number | null;
  isDealer: boolean;
}

export interface GameRound {
  gameIndex: number;
  gameNumber: number;
  cardCount: number;
  trump: Suit;
  phase: RoundPhase;
  playerData: PlayerRoundData[];
}

export interface AppState {
  gameId: string | null;
  gamePhase: GamePhase;
  players: Player[];
  rounds: GameRound[];
  currentRoundIndex: number;
  cardSequence: number[];
  maxCardsPerPlayer: number;
  totalGames: number;
}

export type AppAction =
  | { type: 'SET_PLAYERS'; players: Player[] }
  | { type: 'START_GAME' }
  | { type: 'START_ROUND'; bids: { playerId: string; bid: number }[]; dealerId: string }
  | { type: 'COMPLETE_ROUND'; results: { playerId: string; result: number }[] }
  | { type: 'REORDER_PLAYERS'; fromIndex: number; toIndex: number }
  | { type: 'UPDATE_BIDS'; bids: { playerId: string; bid: number }[] }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_STATE'; state: AppState };
