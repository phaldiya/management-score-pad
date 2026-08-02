import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { GameRound, Player, Suit } from '../../types/index.ts';
import { CloseIcon, PencilIcon } from '../shared/Icons.tsx';
import PlayerAvatar from '../shared/PlayerAvatar.tsx';
import { Tooltip } from '../shared/Tooltip.tsx';
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
    }
  }, [isEditingBids, mode, props, form]);

  const watchedValues = form.watch();
  const total = players.reduce((sum, p) => sum + (Number(watchedValues[`${prefix}_${p.id}`]) || 0), 0);

  // Tap-to-increment: faster than typing on mobile, and keeps the value clamped to [0, cardCount].
  const adjust = (name: string, delta: number) => {
    const current = Number(form.getValues(name)) || 0;
    const next = Math.min(cardCount, Math.max(0, current + delta));
    form.setValue(name, next, { shouldValidate: true, shouldDirty: true });
  };

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

  const rootError = (form.formState.errors as Record<string, { message?: string }>)[`${prefix}_${players[0].id}`];

  const action =
    mode === 'bid' ? 'Place Bids' : mode === 'result' ? 'Enter Results' : isEditingBids ? 'Edit Bids' : 'Details';

  const sectionLabel = activeMode === 'bid' ? 'Bids' : mode === 'result' ? 'Results (hands won)' : 'Bids';

  // Animate the trump card during live play (bid/result) and when viewing the still-active round's details.
  const isActivePlay =
    mode === 'bid' || mode === 'result' || (mode === 'details' && props.round.phase === 'in_progress');

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
          <div className="flex items-center gap-2.5">
            <PlayCard cardCount={cardCount} trump={trump} size="xs" />
            <h2 id="play-form-title" className="leading-tight">
              <span className="block font-bold text-gray-900 text-lg">{action}</span>
              <span className="block font-normal text-gray-500 text-xs">
                Play {gameNumber} &middot; {cardCount} {cardCount === 1 ? 'card' : 'cards'}
              </span>
            </h2>
          </div>
          <Tooltip text="Close (Esc)">
            <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-900" aria-label="Close">
              <CloseIcon />
            </button>
          </Tooltip>
        </div>

        <Wrapper onSubmit={onFormSubmit} className="@container p-4">
          {(mode === 'bid' || isEditingBids) && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <img src={`${import.meta.env.BASE_URL}dealer.png`} alt="Dealer" className="h-8 w-8" />
              <div className="flex flex-col">
                <span className="font-semibold text-[10px] text-amber-600 uppercase tracking-wider">Dealer</span>
                <span className="font-bold text-gray-900 text-sm">{dealerName}</span>
              </div>
            </div>
          )}

          <div className="flex gap-6">
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-700 text-xs uppercase tracking-wider">{sectionLabel}</span>
                  {mode === 'details' && !isEditingBids && props.onEditBids && (
                    <Tooltip text="Edit bids">
                      <button
                        type="button"
                        aria-label="Edit bids"
                        onClick={() => setIsEditingBids(true)}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <PencilIcon />
                      </button>
                    </Tooltip>
                  )}
                </div>
                {ordered.map((p) => {
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
                        <div className="flex items-stretch">
                          <button
                            type="button"
                            aria-label={`Decrease bid for ${p.name}`}
                            onClick={() => adjust(`${prefix}_${p.id}`, -1)}
                            className="flex w-9 items-center justify-center rounded-l border border-red-200 bg-red-50 font-bold text-lg text-red-600 hover:bg-red-100 active:bg-red-200"
                          >
                            &minus;
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={cardCount}
                            readOnly
                            tabIndex={-1}
                            aria-label={`Bid for ${p.name}`}
                            ref={(el) => registerRef?.(el)}
                            {...rest}
                            className="w-12 cursor-default border-gray-300 border-y px-1 py-1 text-center font-bold text-sm focus:outline-none"
                          />
                          <button
                            type="button"
                            aria-label={`Increase bid for ${p.name}`}
                            onClick={() => adjust(`${prefix}_${p.id}`, 1)}
                            className="flex w-9 items-center justify-center rounded-r border border-green-200 bg-green-50 font-bold text-green-600 text-lg hover:bg-green-100 active:bg-green-200"
                          >
                            +
                          </button>
                        </div>
                      )}

                      {mode !== 'bid' && !isEditingBids && (
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded border border-blue-200 bg-blue-50 font-medium text-blue-700 text-xs"
                            title={`Bid: ${pd?.bid}`}
                          >
                            {pd?.bid}
                          </span>
                          {mode === 'details' ? (
                            <span className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-gray-400 text-sm">
                              &mdash;
                            </span>
                          ) : (
                            <div className="flex items-stretch">
                              <button
                                type="button"
                                aria-label={`Decrease result for ${p.name}`}
                                onClick={() => adjust(`${prefix}_${p.id}`, -1)}
                                className="flex w-9 items-center justify-center rounded-l border border-red-200 bg-red-50 font-bold text-lg text-red-600 hover:bg-red-100 active:bg-red-200"
                              >
                                &minus;
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={cardCount}
                                readOnly
                                tabIndex={-1}
                                aria-label={`Result for ${p.name}`}
                                ref={(el) => registerRef?.(el)}
                                {...rest}
                                className="w-12 cursor-default border-gray-300 border-y px-1 py-1 text-center font-bold text-sm focus:outline-none"
                              />
                              <button
                                type="button"
                                aria-label={`Increase result for ${p.name}`}
                                onClick={() => adjust(`${prefix}_${p.id}`, 1)}
                                className="flex w-9 items-center justify-center rounded-r border border-green-200 bg-green-50 font-bold text-green-600 text-lg hover:bg-green-100 active:bg-green-200"
                              >
                                +
                              </button>
                            </div>
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

            <div className="@md:mr-4 @sm:mr-2 @sm:flex hidden shrink-0 flex-col items-center justify-center">
              {/* Trump grows to fill available width, capped at the xl card on wide popups. */}
              <div className="@md:hidden">
                <PlayCard cardCount={cardCount} trump={trump} highlight={isActivePlay} />
              </div>
              <div className="@md:block hidden">
                <PlayCard cardCount={cardCount} trump={trump} size="xl" highlight={isActivePlay} />
              </div>
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
