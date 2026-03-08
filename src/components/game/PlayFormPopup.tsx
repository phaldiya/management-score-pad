import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { GameRound, Player, Suit } from '../../types/index.ts';
import { CloseIcon, PencilIcon } from '../shared/Icons.tsx';
import PlayerAvatar from '../shared/PlayerAvatar.tsx';
import PlayCard from './PlayCard.tsx';

interface Base {
  players: Player[];
  onClose: () => void;
}

interface BidMode extends Base {
  mode: 'bid';
  cardCount: number;
  trump: Suit;
  gameNumber: number;
  dealerId: string;
  onSubmit: (data: { bids: { playerId: string; bid: number }[]; dealerId: string }) => void;
}

interface ResultMode extends Base {
  mode: 'result';
  round: GameRound;
  onSubmit: (results: { playerId: string; result: number }[]) => void;
}

interface DetailsMode extends Base {
  mode: 'details';
  round: GameRound;
  onEditBids?: (bids: { playerId: string; bid: number }[]) => void;
}

type PlayFormPopupProps = BidMode | ResultMode | DetailsMode;

function createPlaySchema(players: Player[], cardCount: number, mode: 'bid' | 'result') {
  const prefix = mode === 'bid' ? 'bid' : 'result';
  const playerFields: Record<string, z.ZodType<number>> = {};
  for (const p of players) {
    playerFields[`${prefix}_${p.id}`] = z.coerce.number().int().min(0).max(cardCount);
  }

  return z.object(playerFields).refine(
    (data) => {
      let total = 0;
      for (const p of players) {
        const val = data[`${prefix}_${p.id}` as keyof typeof data];
        total += typeof val === 'number' ? val : 0;
      }
      return mode === 'bid' ? total !== cardCount : total === cardCount;
    },
    {
      message: mode === 'bid' ? `Total bids cannot equal ${cardCount}` : `Total results must equal ${cardCount}`,
      path: [`${prefix}_${players[0].id}`],
    },
  );
}

export default function PlayFormPopup(props: PlayFormPopupProps) {
  const { players, onClose, mode } = props;
  const [isEditingBids, setIsEditingBids] = useState(false);

  const cardCount = mode === 'bid' ? props.cardCount : props.round.cardCount;
  const trump = mode === 'bid' ? props.trump : props.round.trump;
  const gameNumber = mode === 'bid' ? props.gameNumber : props.round.gameNumber;

  const activeMode = isEditingBids ? 'bid' : mode;
  const schema = activeMode !== 'details' ? createPlaySchema(players, cardCount, activeMode) : undefined;

  const prefix = activeMode === 'bid' ? 'bid' : 'result';
  const defaultValues: Record<string, number> = {};
  for (const p of players) {
    defaultValues[`${prefix}_${p.id}`] = 0;
  }

  const form = useForm<Record<string, number>>({
    // biome-ignore lint/suspicious/noExplicitAny: dynamic zod schema produces incompatible inferred types
    resolver: schema ? (zodResolver(schema) as any) : undefined,
    defaultValues,
  });

  useEffect(() => {
    if (isEditingBids && mode === 'details') {
      const editDefaults: Record<string, number> = {};
      for (const pd of props.round.playerData) {
        editDefaults[`bid_${pd.playerId}`] = pd.bid;
      }
      form.reset(editDefaults);
      hasFocused.current = false;
    }
  }, [isEditingBids, mode, props, form]);

  const watchedValues = form.watch();
  const total = players.reduce((sum, p) => sum + (Number(watchedValues[`${prefix}_${p.id}`]) || 0), 0);

  const dealerId = mode === 'bid' ? props.dealerId : props.round.playerData.find((d) => d.isDealer)?.playerId;
  const dealerIndex = players.findIndex((p) => p.id === dealerId);
  const ordered = [...players.slice(dealerIndex + 1), ...players.slice(0, dealerIndex + 1)];
  const dealerName = players.find((p) => p.id === dealerId)?.name ?? '';

  const onFormSubmit =
    mode === 'bid'
      ? form.handleSubmit((data: Record<string, number>) => {
          const bids = players.map((p) => ({
            playerId: p.id,
            bid: Number(data[`bid_${p.id}`]),
          }));
          props.onSubmit({ bids, dealerId: props.dealerId });
        })
      : mode === 'result'
        ? form.handleSubmit((data: Record<string, number>) => {
            const results = players.map((p) => ({
              playerId: p.id,
              result: Number(data[`result_${p.id}`]),
            }));
            props.onSubmit(results);
          })
        : isEditingBids && mode === 'details' && props.onEditBids
          ? form.handleSubmit((data: Record<string, number>) => {
              const bids = players.map((p) => ({
                playerId: p.id,
                bid: Number(data[`bid_${p.id}`]),
              }));
              props.onEditBids!(bids);
            })
          : undefined;

  const hasFocused = useRef(false);
  const rootError = (form.formState.errors as Record<string, { message?: string }>)[`${prefix}_${players[0].id}`];

  const title =
    mode === 'bid'
      ? `Play ${gameNumber} - Place Bids`
      : mode === 'result'
        ? `Play ${gameNumber} - Enter Results`
        : isEditingBids
          ? `Play ${gameNumber} - Edit Bids`
          : `Play ${gameNumber} - Details`;

  const sectionLabel = activeMode === 'bid' ? 'Bids' : mode === 'result' ? 'Results (hands won)' : 'Bids';

  const Wrapper = mode !== 'details' || isEditingBids ? 'form' : 'div';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="play-form-title"
    >
      <div className="w-full max-w-[min(32rem,calc(100vw-40px))] rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-gray-200 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <PlayCard cardCount={cardCount} trump={trump} size="xs" />
            <h2 id="play-form-title" className="font-bold text-gray-900 text-lg">
              {title}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-900" aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <Wrapper onSubmit={onFormSubmit} className="p-4">
          <div className="flex gap-6">
            <div className="hidden flex-col items-center justify-center sm:flex">
              <PlayCard cardCount={cardCount} trump={trump} />
              <p className="mt-2 text-gray-700 text-sm">{cardCount} cards</p>
            </div>

            <div className="flex-1 space-y-3">
              {(mode === 'bid' || isEditingBids) && (
                <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <img src={`${import.meta.env.BASE_URL}dealer.png`} alt="Dealer" className="h-8 w-8" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-[10px] text-amber-600 uppercase tracking-wider">Dealer</span>
                    <span className="font-bold text-gray-900 text-sm">{dealerName}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-700 text-xs uppercase tracking-wider">{sectionLabel}</span>
                  {mode === 'details' && !isEditingBids && props.onEditBids && (
                    <button
                      type="button"
                      aria-label="Edit bids"
                      onClick={() => setIsEditingBids(true)}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <PencilIcon />
                    </button>
                  )}
                </div>
                {ordered.map((p, idx) => {
                  const pd = mode !== 'bid' ? props.round.playerData.find((d) => d.playerId === p.id) : undefined;
                  const isDealer = mode === 'bid' ? p.id === dealerId : pd?.isDealer;

                  const needsRegistration = activeMode !== 'details';
                  const registration = needsRegistration ? form.register(`${prefix}_${p.id}`) : undefined;
                  const { ref: registerRef, ...rest } = registration ?? { ref: undefined };

                  return (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="flex w-28 items-center gap-1.5 truncate text-gray-700 text-sm">
                        <PlayerAvatar avatar={p.avatar} name={p.name} size="xs" />
                        {p.name}
                        {isDealer && (
                          <img
                            src={`${import.meta.env.BASE_URL}dealer.png`}
                            alt="Dealer"
                            className="h-4 w-4 shrink-0"
                          />
                        )}
                      </span>

                      {(mode === 'bid' || isEditingBids) && (
                        <input
                          type="number"
                          min={0}
                          max={cardCount}
                          aria-label={`Bid for ${p.name}`}
                          ref={(el) => {
                            registerRef?.(el);
                            if (idx === 0 && !hasFocused.current && el) {
                              el.focus();
                              hasFocused.current = true;
                            }
                          }}
                          {...rest}
                          onFocus={(e) => e.currentTarget.select()}
                          onInput={(e) => {
                            const input = e.currentTarget;
                            const val = Number(input.value);
                            if (val > cardCount) input.value = String(cardCount);
                            if (val < 0) input.value = '0';
                          }}
                          className="w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}

                      {mode !== 'bid' && !isEditingBids && (
                        <div className="flex items-stretch">
                          <span className="flex w-8 items-center justify-center rounded-l border border-blue-300 border-r-0 bg-blue-50 font-medium text-blue-700 text-xs">
                            {pd?.bid}
                          </span>
                          {mode === 'details' ? (
                            <span className="w-16 rounded-r border border-gray-300 px-2 py-1 text-center text-gray-400 text-sm">
                              &mdash;
                            </span>
                          ) : (
                            <input
                              type="number"
                              min={0}
                              max={cardCount}
                              aria-label={`Result for ${p.name}`}
                              ref={(el) => {
                                registerRef?.(el);
                                if (idx === 0 && el && !hasFocused.current) {
                                  hasFocused.current = true;
                                  el.focus();
                                }
                              }}
                              {...rest}
                              onFocus={(e) => e.currentTarget.select()}
                              onInput={(e) => {
                                const input = e.currentTarget;
                                const val = Number(input.value);
                                if (val > cardCount) input.value = String(cardCount);
                                if (val < 0) input.value = '0';
                              }}
                              className="w-16 rounded-r border border-gray-300 px-2 py-1 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {(mode === 'bid' || isEditingBids) && (
                <>
                  <div className={`font-medium text-sm ${total === cardCount ? 'text-red-600' : 'text-gray-600'}`}>
                    Total: {total} / {cardCount} {total === cardCount && '(cannot equal card count!)'}
                  </div>
                  {rootError && (
                    <p className="text-red-600 text-sm" role="alert">
                      {rootError.message}
                    </p>
                  )}
                </>
              )}

              {mode === 'result' && (
                <>
                  <div className={`font-medium text-sm ${total === cardCount ? 'text-green-600' : 'text-red-600'}`}>
                    Total: {total} / {cardCount} {total !== cardCount && '(must equal card count!)'}
                  </div>
                  {rootError && (
                    <p className="text-red-600 text-sm" role="alert">
                      {rootError.message}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {mode === 'bid' && (
            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700"
            >
              Play!
            </button>
          )}

          {mode === 'result' && (
            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700"
            >
              Submit Results
            </button>
          )}

          {isEditingBids && (
            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700"
            >
              Update Bids
            </button>
          )}
        </Wrapper>
      </div>
    </div>
  );
}
