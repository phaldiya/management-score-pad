import { beforeEach, describe, expect, it } from 'vitest';

import { testPlayers } from '../../tests/helpers/fixtures.ts';
import { applyActions, createTestState } from '../../tests/helpers/testReducer.ts';
import { appReducer, initialState } from './AppContext.tsx';

describe('reducer spec', () => {
  it('unknown action type returns state unchanged', () => {
    const state = createTestState();
    // @ts-expect-error testing unknown action
    const result = appReducer(state, { type: 'UNKNOWN_ACTION' });
    expect(result).toBe(state);
  });

  it('START_ROUND with missing player in bids defaults to bid=0', () => {
    const state = createTestState({
      gameId: 'g1',
      gamePhase: 'playing',
      players: testPlayers,
      cardSequence: [17, 16, 15],
      currentRoundIndex: -1,
    });
    const result = appReducer(state, {
      type: 'START_ROUND',
      bids: [{ playerId: 'p1', bid: 3 }], // p2, p3 missing
      dealerId: 'p1',
    });
    const pd = result.rounds[0].playerData;
    expect(pd.find((p) => p.playerId === 'p2')!.bid).toBe(0);
    expect(pd.find((p) => p.playerId === 'p3')!.bid).toBe(0);
  });

  it('COMPLETE_ROUND with missing player in results defaults to result=0', () => {
    const state = createTestState({
      gameId: 'g1',
      gamePhase: 'playing',
      players: testPlayers,
      cardSequence: [17, 16],
      currentRoundIndex: 0,
      rounds: [
        {
          gameIndex: 0,
          gameNumber: 1,
          cardCount: 17,
          trump: 'spades',
          phase: 'in_progress',
          playerData: [
            { playerId: 'p1', bid: 3, result: null, score: null, isDealer: true },
            { playerId: 'p2', bid: 2, result: null, score: null, isDealer: false },
            { playerId: 'p3', bid: 0, result: null, score: null, isDealer: false },
          ],
        },
      ],
    });
    const result = appReducer(state, {
      type: 'COMPLETE_ROUND',
      results: [{ playerId: 'p1', result: 3 }], // p2, p3 missing
    });
    const pd = result.rounds[0].playerData;
    expect(pd.find((p) => p.playerId === 'p2')!.result).toBe(0);
    expect(pd.find((p) => p.playerId === 'p3')!.result).toBe(0);
  });

  it('UPDATE_BIDS updates bids on current in-progress round', () => {
    const state = createTestState({
      gameId: 'g1',
      gamePhase: 'playing',
      players: testPlayers,
      cardSequence: [17, 16],
      currentRoundIndex: 0,
      rounds: [
        {
          gameIndex: 0,
          gameNumber: 1,
          cardCount: 17,
          trump: 'spades',
          phase: 'in_progress',
          playerData: [
            { playerId: 'p1', bid: 3, result: null, score: null, isDealer: true },
            { playerId: 'p2', bid: 2, result: null, score: null, isDealer: false },
            { playerId: 'p3', bid: 0, result: null, score: null, isDealer: false },
          ],
        },
      ],
    });
    const result = appReducer(state, {
      type: 'UPDATE_BIDS',
      bids: [
        { playerId: 'p1', bid: 5 },
        { playerId: 'p2', bid: 4 },
        { playerId: 'p3', bid: 6 },
      ],
    });
    const pd = result.rounds[0].playerData;
    expect(pd[0].bid).toBe(5);
    expect(pd[1].bid).toBe(4);
    expect(pd[2].bid).toBe(6);
  });

  it('UPDATE_BIDS preserves phase, trump, and dealer', () => {
    const state = createTestState({
      gameId: 'g1',
      gamePhase: 'playing',
      players: testPlayers,
      cardSequence: [17, 16],
      currentRoundIndex: 0,
      rounds: [
        {
          gameIndex: 0,
          gameNumber: 1,
          cardCount: 17,
          trump: 'spades',
          phase: 'in_progress',
          playerData: [
            { playerId: 'p1', bid: 3, result: null, score: null, isDealer: true },
            { playerId: 'p2', bid: 2, result: null, score: null, isDealer: false },
            { playerId: 'p3', bid: 0, result: null, score: null, isDealer: false },
          ],
        },
      ],
    });
    const result = appReducer(state, {
      type: 'UPDATE_BIDS',
      bids: [{ playerId: 'p1', bid: 5 }],
    });
    const round = result.rounds[0];
    expect(round.phase).toBe('in_progress');
    expect(round.trump).toBe('spades');
    expect(round.playerData[0].isDealer).toBe(true);
    expect(round.playerData[1].isDealer).toBe(false);
  });

  it('UPDATE_BIDS does not mutate previous state', () => {
    const inProgressRound = {
      gameIndex: 0,
      gameNumber: 1,
      cardCount: 17,
      trump: 'spades' as const,
      phase: 'in_progress' as const,
      playerData: [
        { playerId: 'p1', bid: 3, result: null, score: null, isDealer: true },
        { playerId: 'p2', bid: 2, result: null, score: null, isDealer: false },
        { playerId: 'p3', bid: 0, result: null, score: null, isDealer: false },
      ],
    };
    const state = createTestState({
      gameId: 'g1',
      gamePhase: 'playing',
      players: testPlayers,
      cardSequence: [17, 16],
      currentRoundIndex: 0,
      rounds: [inProgressRound],
    });
    const pdBefore = state.rounds[0].playerData[0];
    appReducer(state, {
      type: 'UPDATE_BIDS',
      bids: [{ playerId: 'p1', bid: 99 }],
    });
    expect(state.rounds[0].playerData[0]).toBe(pdBefore);
    expect(state.rounds[0].playerData[0].bid).toBe(3);
  });

  it('UPDATE_BIDS with missing player falls back to existing bid', () => {
    const state = createTestState({
      gameId: 'g1',
      gamePhase: 'playing',
      players: testPlayers,
      cardSequence: [17, 16],
      currentRoundIndex: 0,
      rounds: [
        {
          gameIndex: 0,
          gameNumber: 1,
          cardCount: 17,
          trump: 'spades',
          phase: 'in_progress',
          playerData: [
            { playerId: 'p1', bid: 3, result: null, score: null, isDealer: true },
            { playerId: 'p2', bid: 2, result: null, score: null, isDealer: false },
            { playerId: 'p3', bid: 0, result: null, score: null, isDealer: false },
          ],
        },
      ],
    });
    const result = appReducer(state, {
      type: 'UPDATE_BIDS',
      bids: [{ playerId: 'p1', bid: 7 }], // p2, p3 missing
    });
    const pd = result.rounds[0].playerData;
    expect(pd[0].bid).toBe(7);
    expect(pd[1].bid).toBe(2); // unchanged
    expect(pd[2].bid).toBe(0); // unchanged
  });

  it('REORDER_PLAYERS same index produces no change', () => {
    const state = createTestState({ players: testPlayers });
    const result = appReducer(state, { type: 'REORDER_PLAYERS', fromIndex: 1, toIndex: 1 });
    expect(result.players.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
  });

  it('REORDER_PLAYERS last to first', () => {
    const state = createTestState({ players: testPlayers });
    const result = appReducer(state, { type: 'REORDER_PLAYERS', fromIndex: 2, toIndex: 0 });
    expect(result.players.map((p) => p.id)).toEqual(['p3', 'p1', 'p2']);
  });

  it('REORDER_PLAYERS first to last', () => {
    const state = createTestState({ players: testPlayers });
    const result = appReducer(state, { type: 'REORDER_PLAYERS', fromIndex: 0, toIndex: 2 });
    expect(result.players.map((p) => p.id)).toEqual(['p2', 'p3', 'p1']);
  });

  it.each([
    { count: 4, expectedMax: 13, expectedTotal: 25 },
    { count: 5, expectedMax: 10, expectedTotal: 19 },
    { count: 6, expectedMax: 8, expectedTotal: 15 },
  ])('START_GAME with $count players gives maxCards=$expectedMax, totalGames=$expectedTotal', ({
    count,
    expectedMax,
    expectedTotal,
  }) => {
    const players = Array.from({ length: count }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      avatar: 'bottts:Zoe',
    }));
    const state = createTestState({ players });
    const result = appReducer(state, { type: 'START_GAME' });
    expect(result.maxCardsPerPlayer).toBe(expectedMax);
    expect(result.totalGames).toBe(expectedTotal);
    expect(result.cardSequence).toHaveLength(expectedTotal);
  });

  it('START_ROUND does not mutate previous state object', () => {
    const state = createTestState({
      gameId: 'g1',
      gamePhase: 'playing',
      players: testPlayers,
      cardSequence: [17, 16],
      currentRoundIndex: -1,
      rounds: [],
    });
    const roundsBefore = state.rounds;
    appReducer(state, {
      type: 'START_ROUND',
      bids: testPlayers.map((p) => ({ playerId: p.id, bid: 1 })),
      dealerId: 'p1',
    });
    expect(state.rounds).toBe(roundsBefore);
    expect(state.rounds).toHaveLength(0);
  });

  it('COMPLETE_ROUND does not mutate previous state rounds', () => {
    const inProgressRound = {
      gameIndex: 0,
      gameNumber: 1,
      cardCount: 17,
      trump: 'spades' as const,
      phase: 'in_progress' as const,
      playerData: [
        { playerId: 'p1', bid: 3, result: null, score: null, isDealer: true },
        { playerId: 'p2', bid: 2, result: null, score: null, isDealer: false },
        { playerId: 'p3', bid: 0, result: null, score: null, isDealer: false },
      ],
    };
    const state = createTestState({
      gameId: 'g1',
      gamePhase: 'playing',
      players: testPlayers,
      cardSequence: [17, 16],
      currentRoundIndex: 0,
      rounds: [inProgressRound],
    });
    const roundRef = state.rounds[0];
    appReducer(state, {
      type: 'COMPLETE_ROUND',
      results: testPlayers.map((p) => ({ playerId: p.id, result: 1 })),
    });
    expect(state.rounds[0]).toBe(roundRef);
    expect(state.rounds[0].phase).toBe('in_progress');
  });
});

describe('reducer – deep', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('SET_PLAYERS → START_GAME', () => {
    it('sets up game with correct fields', () => {
      const state = applyActions(createTestState(), [
        { type: 'SET_PLAYERS', players: testPlayers },
        { type: 'START_GAME' },
      ]);

      expect(state.gameId).toBeTruthy();
      expect(state.gamePhase).toBe('playing');
      expect(state.players).toEqual(testPlayers);
      expect(state.maxCardsPerPlayer).toBe(17);
      expect(state.totalGames).toBe(33);
      expect(state.cardSequence).toHaveLength(33);
      expect(state.cardSequence[0]).toBe(17);
    });
  });

  describe('START_ROUND', () => {
    it('creates round with correct cardCount, trump, bids, dealerId', () => {
      let state = applyActions(createTestState(), [
        { type: 'SET_PLAYERS', players: testPlayers },
        { type: 'START_GAME' },
      ]);

      state = appReducer(state, {
        type: 'START_ROUND',
        bids: [
          { playerId: 'p1', bid: 3 },
          { playerId: 'p2', bid: 2 },
          { playerId: 'p3', bid: 1 },
        ],
        dealerId: 'p1',
      });

      expect(state.currentRoundIndex).toBe(0);
      expect(state.rounds).toHaveLength(1);

      const round = state.rounds[0];
      expect(round.cardCount).toBe(17);
      expect(round.trump).toBe('spades');
      expect(round.phase).toBe('in_progress');
      expect(round.playerData[0].bid).toBe(3);
      expect(round.playerData[0].isDealer).toBe(true);
      expect(round.playerData[1].bid).toBe(2);
      expect(round.playerData[1].isDealer).toBe(false);
    });
  });

  describe('COMPLETE_ROUND', () => {
    it('sets scores and marks phase as completed', () => {
      let state = applyActions(createTestState(), [
        { type: 'SET_PLAYERS', players: testPlayers },
        { type: 'START_GAME' },
      ]);

      state = appReducer(state, {
        type: 'START_ROUND',
        bids: [
          { playerId: 'p1', bid: 3 },
          { playerId: 'p2', bid: 0 },
          { playerId: 'p3', bid: 2 },
        ],
        dealerId: 'p1',
      });

      state = appReducer(state, {
        type: 'COMPLETE_ROUND',
        results: [
          { playerId: 'p1', result: 3 },
          { playerId: 'p2', result: 0 },
          { playerId: 'p3', result: 1 },
        ],
      });

      const round = state.rounds[0];
      expect(round.phase).toBe('completed');
      expect(round.playerData[0].score).toBe(30);
      expect(round.playerData[1].score).toBe(10);
      expect(round.playerData[2].score).toBe(0);
    });
  });

  describe('UNDO_LAST_ROUND', () => {
    it('removes last completed round and decrements currentRoundIndex', () => {
      let state = applyActions(createTestState(), [
        { type: 'SET_PLAYERS', players: testPlayers },
        { type: 'START_GAME' },
      ]);
      state = appReducer(state, {
        type: 'START_ROUND',
        bids: testPlayers.map((p) => ({ playerId: p.id, bid: 1 })),
        dealerId: 'p1',
      });
      state = appReducer(state, {
        type: 'COMPLETE_ROUND',
        results: testPlayers.map((p) => ({ playerId: p.id, result: 1 })),
      });
      expect(state.rounds).toHaveLength(1);
      expect(state.currentRoundIndex).toBe(0);

      state = appReducer(state, { type: 'UNDO_LAST_ROUND' });
      expect(state.rounds).toHaveLength(0);
      expect(state.currentRoundIndex).toBe(-1);
    });

    it('returns state unchanged when no rounds exist', () => {
      const state = createTestState({
        gameId: 'g1',
        gamePhase: 'playing',
        players: testPlayers,
        rounds: [],
        currentRoundIndex: -1,
      });
      const result = appReducer(state, { type: 'UNDO_LAST_ROUND' });
      expect(result).toBe(state);
    });

    it('returns state unchanged when last round is in_progress', () => {
      const state = createTestState({
        gameId: 'g1',
        gamePhase: 'playing',
        players: testPlayers,
        cardSequence: [17, 16],
        currentRoundIndex: 0,
        rounds: [
          {
            gameIndex: 0,
            gameNumber: 1,
            cardCount: 17,
            trump: 'spades',
            phase: 'in_progress',
            playerData: [
              { playerId: 'p1', bid: 3, result: null, score: null, isDealer: true },
              { playerId: 'p2', bid: 2, result: null, score: null, isDealer: false },
              { playerId: 'p3', bid: 0, result: null, score: null, isDealer: false },
            ],
          },
        ],
      });
      const result = appReducer(state, { type: 'UNDO_LAST_ROUND' });
      expect(result).toBe(state);
    });

    it('does not mutate previous state', () => {
      const completedRound = {
        gameIndex: 0,
        gameNumber: 1,
        cardCount: 17,
        trump: 'spades' as const,
        phase: 'completed' as const,
        playerData: [
          { playerId: 'p1', bid: 3, result: 3, score: 30, isDealer: true },
          { playerId: 'p2', bid: 2, result: 2, score: 20, isDealer: false },
          { playerId: 'p3', bid: 0, result: 0, score: 10, isDealer: false },
        ],
      };
      const state = createTestState({
        gameId: 'g1',
        gamePhase: 'playing',
        players: testPlayers,
        cardSequence: [17, 16],
        currentRoundIndex: 0,
        rounds: [completedRound],
      });
      const roundsBefore = state.rounds;
      appReducer(state, { type: 'UNDO_LAST_ROUND' });
      expect(state.rounds).toBe(roundsBefore);
      expect(state.rounds).toHaveLength(1);
      expect(state.currentRoundIndex).toBe(0);
    });

    it('preserves gameId, gamePhase, players, and cardSequence', () => {
      let state = applyActions(createTestState(), [
        { type: 'SET_PLAYERS', players: testPlayers },
        { type: 'START_GAME' },
      ]);
      const { gameId, gamePhase, players, cardSequence, totalGames } = state;

      state = appReducer(state, {
        type: 'START_ROUND',
        bids: testPlayers.map((p) => ({ playerId: p.id, bid: 1 })),
        dealerId: 'p1',
      });
      state = appReducer(state, {
        type: 'COMPLETE_ROUND',
        results: testPlayers.map((p) => ({ playerId: p.id, result: 1 })),
      });
      state = appReducer(state, { type: 'UNDO_LAST_ROUND' });

      expect(state.gameId).toBe(gameId);
      expect(state.gamePhase).toBe(gamePhase);
      expect(state.players).toEqual(players);
      expect(state.cardSequence).toEqual(cardSequence);
      expect(state.totalGames).toBe(totalGames);
    });

    it('only removes last completed round when in-progress round follows', () => {
      let state = applyActions(createTestState(), [
        { type: 'SET_PLAYERS', players: testPlayers },
        { type: 'START_GAME' },
      ]);

      // Complete round 1
      state = appReducer(state, {
        type: 'START_ROUND',
        bids: testPlayers.map((p) => ({ playerId: p.id, bid: 1 })),
        dealerId: 'p1',
      });
      state = appReducer(state, {
        type: 'COMPLETE_ROUND',
        results: testPlayers.map((p) => ({ playerId: p.id, result: 1 })),
      });

      // Start round 2 (in progress, not completed)
      state = appReducer(state, {
        type: 'START_ROUND',
        bids: testPlayers.map((p) => ({ playerId: p.id, bid: 2 })),
        dealerId: 'p2',
      });
      expect(state.rounds).toHaveLength(2);
      expect(state.rounds[1].phase).toBe('in_progress');

      // UNDO should not remove in-progress round
      const result = appReducer(state, { type: 'UNDO_LAST_ROUND' });
      expect(result).toBe(state);
    });

    it('allows replay after delete — START_ROUND uses same card sequence slot', () => {
      let state = applyActions(createTestState(), [
        { type: 'SET_PLAYERS', players: testPlayers },
        { type: 'START_GAME' },
      ]);

      // Play and complete round 1
      state = appReducer(state, {
        type: 'START_ROUND',
        bids: testPlayers.map((p) => ({ playerId: p.id, bid: 1 })),
        dealerId: 'p1',
      });
      const firstRoundCardCount = state.rounds[0].cardCount;
      const firstRoundTrump = state.rounds[0].trump;

      state = appReducer(state, {
        type: 'COMPLETE_ROUND',
        results: testPlayers.map((p) => ({ playerId: p.id, result: 1 })),
      });

      // Delete it
      state = appReducer(state, { type: 'UNDO_LAST_ROUND' });
      expect(state.currentRoundIndex).toBe(-1);

      // Replay — should get same cardCount and trump
      state = appReducer(state, {
        type: 'START_ROUND',
        bids: testPlayers.map((p) => ({ playerId: p.id, bid: 2 })),
        dealerId: 'p1',
      });
      expect(state.rounds[0].cardCount).toBe(firstRoundCardCount);
      expect(state.rounds[0].trump).toBe(firstRoundTrump);
      expect(state.currentRoundIndex).toBe(0);
    });

    it('consecutive deletes remove rounds one by one', () => {
      let state = applyActions(createTestState(), [
        { type: 'SET_PLAYERS', players: testPlayers },
        { type: 'START_GAME' },
      ]);

      // Play 3 rounds
      for (let i = 0; i < 3; i++) {
        state = appReducer(state, {
          type: 'START_ROUND',
          bids: testPlayers.map((p) => ({ playerId: p.id, bid: 1 })),
          dealerId: testPlayers[i].id,
        });
        state = appReducer(state, {
          type: 'COMPLETE_ROUND',
          results: testPlayers.map((p) => ({ playerId: p.id, result: 1 })),
        });
      }
      expect(state.rounds).toHaveLength(3);
      expect(state.currentRoundIndex).toBe(2);

      // Delete all 3 one by one
      state = appReducer(state, { type: 'UNDO_LAST_ROUND' });
      expect(state.rounds).toHaveLength(2);
      expect(state.currentRoundIndex).toBe(1);

      state = appReducer(state, { type: 'UNDO_LAST_ROUND' });
      expect(state.rounds).toHaveLength(1);
      expect(state.currentRoundIndex).toBe(0);

      state = appReducer(state, { type: 'UNDO_LAST_ROUND' });
      expect(state.rounds).toHaveLength(0);
      expect(state.currentRoundIndex).toBe(-1);

      // No more to delete
      const result = appReducer(state, { type: 'UNDO_LAST_ROUND' });
      expect(result).toBe(state);
    });

    it('undo after multiple rounds restores to correct state', () => {
      let state = applyActions(createTestState(), [
        { type: 'SET_PLAYERS', players: testPlayers },
        { type: 'START_GAME' },
      ]);

      // Play 2 rounds
      state = appReducer(state, {
        type: 'START_ROUND',
        bids: [
          { playerId: 'p1', bid: 3 },
          { playerId: 'p2', bid: 2 },
          { playerId: 'p3', bid: 0 },
        ],
        dealerId: 'p1',
      });
      state = appReducer(state, {
        type: 'COMPLETE_ROUND',
        results: [
          { playerId: 'p1', result: 3 },
          { playerId: 'p2', result: 2 },
          { playerId: 'p3', result: 0 },
        ],
      });
      state = appReducer(state, {
        type: 'START_ROUND',
        bids: [
          { playerId: 'p1', bid: 1 },
          { playerId: 'p2', bid: 4 },
          { playerId: 'p3', bid: 1 },
        ],
        dealerId: 'p2',
      });
      state = appReducer(state, {
        type: 'COMPLETE_ROUND',
        results: [
          { playerId: 'p1', result: 1 },
          { playerId: 'p2', result: 4 },
          { playerId: 'p3', result: 1 },
        ],
      });
      expect(state.rounds).toHaveLength(2);
      expect(state.currentRoundIndex).toBe(1);

      // Undo last round
      state = appReducer(state, { type: 'UNDO_LAST_ROUND' });
      expect(state.rounds).toHaveLength(1);
      expect(state.currentRoundIndex).toBe(0);
      expect(state.rounds[0].phase).toBe('completed');
      expect(state.rounds[0].playerData[0].score).toBe(30);
    });
  });

  describe('REORDER_PLAYERS', () => {
    it('swaps player positions', () => {
      const state = applyActions(createTestState({ players: testPlayers }), [
        { type: 'REORDER_PLAYERS', fromIndex: 0, toIndex: 2 },
      ]);

      expect(state.players[0].id).toBe('p2');
      expect(state.players[1].id).toBe('p3');
      expect(state.players[2].id).toBe('p1');
    });
  });

  describe('RESET_GAME', () => {
    it('returns to initialState and clears localStorage', () => {
      let state = applyActions(createTestState(), [
        { type: 'SET_PLAYERS', players: testPlayers },
        { type: 'START_GAME' },
      ]);

      // Manually save so there's something in localStorage
      localStorage.setItem('management-score-pad-active', state.gameId!);
      localStorage.setItem(`management-score-pad-${state.gameId}`, JSON.stringify(state));

      state = appReducer(state, { type: 'RESET_GAME' });

      expect(state).toEqual(initialState);
      expect(localStorage.getItem('management-score-pad-active')).toBeNull();
    });
  });

  describe('LOAD_STATE', () => {
    it('replaces entire state', () => {
      const savedState = createTestState({
        gameId: 'loaded-game',
        gamePhase: 'playing',
        players: testPlayers,
        totalGames: 33,
      });

      const state = appReducer(initialState, { type: 'LOAD_STATE', state: savedState });

      expect(state.gameId).toBe('loaded-game');
      expect(state.gamePhase).toBe('playing');
      expect(state.players).toEqual(testPlayers);
    });
  });

  describe('multiple rounds flow', () => {
    it('play 3 full rounds and verify state after each', () => {
      let state = applyActions(createTestState(), [
        { type: 'SET_PLAYERS', players: testPlayers },
        { type: 'START_GAME' },
      ]);

      // Round 1: cardCount=17, trump=spades
      state = appReducer(state, {
        type: 'START_ROUND',
        bids: [
          { playerId: 'p1', bid: 3 },
          { playerId: 'p2', bid: 2 },
          { playerId: 'p3', bid: 0 },
        ],
        dealerId: 'p1',
      });
      state = appReducer(state, {
        type: 'COMPLETE_ROUND',
        results: [
          { playerId: 'p1', result: 3 },
          { playerId: 'p2', result: 2 },
          { playerId: 'p3', result: 0 },
        ],
      });
      expect(state.rounds).toHaveLength(1);
      expect(state.rounds[0].phase).toBe('completed');
      expect(state.rounds[0].playerData[0].score).toBe(30);
      expect(state.rounds[0].playerData[1].score).toBe(20);
      expect(state.rounds[0].playerData[2].score).toBe(10);

      // Round 2: cardCount=16, trump=hearts
      state = appReducer(state, {
        type: 'START_ROUND',
        bids: [
          { playerId: 'p1', bid: 0 },
          { playerId: 'p2', bid: 4 },
          { playerId: 'p3', bid: 1 },
        ],
        dealerId: 'p2',
      });
      expect(state.currentRoundIndex).toBe(1);
      expect(state.rounds[1].cardCount).toBe(16);
      expect(state.rounds[1].trump).toBe('hearts');

      state = appReducer(state, {
        type: 'COMPLETE_ROUND',
        results: [
          { playerId: 'p1', result: 0 },
          { playerId: 'p2', result: 4 },
          { playerId: 'p3', result: 2 },
        ],
      });
      expect(state.rounds[1].playerData[0].score).toBe(10);
      expect(state.rounds[1].playerData[1].score).toBe(40);
      expect(state.rounds[1].playerData[2].score).toBe(0);

      // Round 3: cardCount=15, trump=clubs
      state = appReducer(state, {
        type: 'START_ROUND',
        bids: [
          { playerId: 'p1', bid: 5 },
          { playerId: 'p2', bid: 0 },
          { playerId: 'p3', bid: 2 },
        ],
        dealerId: 'p3',
      });
      expect(state.rounds[2].cardCount).toBe(15);
      expect(state.rounds[2].trump).toBe('clubs');

      state = appReducer(state, {
        type: 'COMPLETE_ROUND',
        results: [
          { playerId: 'p1', result: 5 },
          { playerId: 'p2', result: 1 },
          { playerId: 'p3', result: 2 },
        ],
      });
      expect(state.rounds).toHaveLength(3);
      expect(state.rounds[2].playerData[0].score).toBe(50);
      expect(state.rounds[2].playerData[1].score).toBe(0);
      expect(state.rounds[2].playerData[2].score).toBe(20);
    });
  });
});
