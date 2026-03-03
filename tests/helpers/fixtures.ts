import type { GameRound, Player } from '../../src/types/index.ts';

export const testPlayers: Player[] = [
  { id: 'p1', name: 'Alice', avatar: 'bottts:Zoe' },
  { id: 'p2', name: 'Bob', avatar: 'bottts:Zoe' },
  { id: 'p3', name: 'Charlie', avatar: 'bottts:Zoe' },
];

export const sevenPlayers: Player[] = [
  { id: 'p1', name: 'Alice', avatar: 'bottts:Zoe' },
  { id: 'p2', name: 'Bob', avatar: 'bottts:Zoe' },
  { id: 'p3', name: 'Charlie', avatar: 'bottts:Zoe' },
  { id: 'p4', name: 'Diana', avatar: 'bottts:Zoe' },
  { id: 'p5', name: 'Eve', avatar: 'bottts:Zoe' },
  { id: 'p6', name: 'Frank', avatar: 'bottts:Zoe' },
  { id: 'p7', name: 'Grace', avatar: 'bottts:Zoe' },
];

export const completedRound: GameRound = {
  gameIndex: 0,
  gameNumber: 1,
  cardCount: 17,
  trump: 'spades',
  phase: 'completed',
  playerData: [
    { playerId: 'p1', bid: 3, result: 3, score: 30, isDealer: true },
    { playerId: 'p2', bid: 2, result: 1, score: 0, isDealer: false },
    { playerId: 'p3', bid: 0, result: 0, score: 10, isDealer: false },
  ],
};

export const inProgressRound: GameRound = {
  gameIndex: 1,
  gameNumber: 2,
  cardCount: 16,
  trump: 'hearts',
  phase: 'in_progress',
  playerData: [
    { playerId: 'p1', bid: 2, result: null, score: null, isDealer: false },
    { playerId: 'p2', bid: 3, result: null, score: null, isDealer: true },
    { playerId: 'p3', bid: 1, result: null, score: null, isDealer: false },
  ],
};
