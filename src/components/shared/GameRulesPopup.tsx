import { useEffect } from 'react';

import { isSuitRed } from '../../lib/gameLogic.ts';
import { CloseIcon, SuitIcon } from './Icons.tsx';

interface GameRulesPopupProps {
  onClose: () => void;
}

const SUITS = ['spades', 'hearts', 'clubs', 'diamonds'] as const;

export function GameRulesPopup({ onClose }: GameRulesPopupProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-gray-200 border-b px-4 py-3">
          <h2 className="flex items-center gap-1 font-bold text-gray-900">
            Game Rules
            {SUITS.map((s) => (
              <SuitIcon key={s} suit={s} className="h-4 w-4" />
            ))}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="max-h-[80vh] space-y-4 overflow-y-auto p-4 text-sm">
          {/* Overview */}
          <section>
            <h3 className="mb-1 font-semibold text-gray-900">Overview</h3>
            <p className="text-gray-600">
              Management/Judgement is a trick-taking card game. Players predict how many tricks they'll win each round.
              This app tracks bids, results, and scores across all rounds.
            </p>
          </section>

          {/* Seating Order */}
          <section>
            <h3 className="mb-1 font-semibold text-gray-900">Seating Order</h3>
            <p className="mb-2 text-gray-600">
              Before the first play, arrange players in <strong>clockwise seating order</strong> using the{' '}
              <span className="inline-block rounded bg-gray-100 px-1 font-medium text-gray-500 text-xs">&larr;</span>{' '}
              <span className="inline-block rounded bg-gray-100 px-1 font-medium text-gray-500 text-xs">&rarr;</span>{' '}
              arrows.
            </p>
            <p className="text-gray-600">This matters because:</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-gray-600">
              <li>
                The <strong>dealer</strong>{' '}
                <img
                  src={`${import.meta.env.BASE_URL}dealer.png`}
                  alt="dealer"
                  className="inline-block h-4 w-4 align-text-bottom"
                />{' '}
                rotates clockwise each round
              </li>
              <li>The dealer bids last and has a restricted bid (total bids &ne; card count)</li>
              <li>Wrong seating order means the wrong player gets the dealer disadvantage</li>
            </ul>
          </section>

          {/* Rounds & Cards */}
          <section>
            <h3 className="mb-1 font-semibold text-gray-900">Rounds & Cards</h3>
            <p className="mb-2 text-gray-600">
              Cards per round go from max down to 1, then back up to max.
              <br />
              Max cards = floor(52 &divide; players)
            </p>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-gray-200 border-b">
                  <th className="py-1 pr-2 font-medium text-gray-500">Players</th>
                  <th className="py-1 pr-2 font-medium text-gray-500">Max Cards</th>
                  <th className="py-1 font-medium text-gray-500">Total Rounds</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr>
                  <td className="py-0.5 pr-2">3</td>
                  <td className="py-0.5 pr-2">17</td>
                  <td className="py-0.5">33</td>
                </tr>
                <tr>
                  <td className="py-0.5 pr-2">4</td>
                  <td className="py-0.5 pr-2">13</td>
                  <td className="py-0.5">25</td>
                </tr>
                <tr>
                  <td className="py-0.5 pr-2">5</td>
                  <td className="py-0.5 pr-2">10</td>
                  <td className="py-0.5">19</td>
                </tr>
                <tr>
                  <td className="py-0.5 pr-2">6</td>
                  <td className="py-0.5 pr-2">8</td>
                  <td className="py-0.5">15</td>
                </tr>
                <tr>
                  <td className="py-0.5 pr-2">7</td>
                  <td className="py-0.5 pr-2">7</td>
                  <td className="py-0.5">13</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Trump Rotation */}
          <section>
            <h3 className="mb-1 font-semibold text-gray-900">Trump Rotation</h3>
            <p className="mb-2 text-gray-600">Trump suit cycles each round:</p>
            <div className="flex items-center gap-2">
              {SUITS.map((suit, i) => (
                <span key={suit} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-400">&rarr;</span>}
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium text-xs ${isSuitRed(suit) ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-900'}`}
                  >
                    <SuitIcon suit={suit} className="h-3 w-3" />
                    {suit.charAt(0).toUpperCase() + suit.slice(1)}
                  </span>
                </span>
              ))}
              <span className="text-gray-400">&rarr; repeat</span>
            </div>
          </section>

          {/* Bidding Rules */}
          <section>
            <h3 className="mb-1 font-semibold text-gray-900">Bidding Rules</h3>
            <ul className="list-disc space-y-1 pl-4 text-gray-600">
              <li>Predict tricks you'll win (0 to card count)</li>
              <li>
                Dealer{' '}
                <img
                  src={`${import.meta.env.BASE_URL}dealer.png`}
                  alt="dealer"
                  className="inline-block h-4 w-4 align-text-bottom"
                />{' '}
                bids last &mdash; total bids <strong>cannot</strong> equal the card count
              </li>
            </ul>
          </section>

          {/* Scoring */}
          <section>
            <h3 className="mb-2 font-semibold text-gray-900">Scoring</h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-gray-200 border-b">
                  <th className="py-1 pr-2 font-medium text-gray-500">Situation</th>
                  <th className="py-1 pr-2 font-medium text-gray-500">Points</th>
                  <th className="py-1 font-medium text-gray-500">Example</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-green-50">
                  <td className="py-1.5 pr-2 text-gray-700">Bid met (bid &gt; 0)</td>
                  <td className="py-1.5 pr-2 text-gray-700">bid &times; 10</td>
                  <td className="py-1.5 text-gray-700">
                    Bid 3, won 3 &rarr; <strong>30</strong>
                  </td>
                </tr>
                <tr className="bg-green-50">
                  <td className="py-1.5 pr-2 text-gray-700">Bid zero met</td>
                  <td className="py-1.5 pr-2 text-gray-700">10</td>
                  <td className="py-1.5 text-gray-700">
                    Bid 0, won 0 &rarr; <strong>10</strong>
                  </td>
                </tr>
                <tr className="bg-red-50">
                  <td className="py-1.5 pr-2 text-gray-700">Bid missed</td>
                  <td className="py-1.5 pr-2 text-gray-700">0</td>
                  <td className="py-1.5 text-gray-700">
                    Bid 3, won 5 &rarr; <strong>0</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Scoreboard Reading Guide */}
          <section>
            <h3 className="mb-1 font-semibold text-gray-900">Reading the Scoreboard</h3>
            <ul className="list-disc space-y-1 pl-4 text-gray-600">
              <li>
                Large number = <strong>score</strong> for that round
              </li>
              <li>
                Small colored badges: <span className="rounded bg-blue-100 px-1 text-blue-700 text-xs">blue</span> =
                bid, <span className="rounded bg-green-100 px-1 text-green-700 text-xs">green</span> = result
              </li>
              <li>
                <span className="rounded bg-green-50 px-1 text-xs">Green cell</span> = bid met,{' '}
                <span className="rounded bg-red-50 px-1 text-xs">red cell</span> = missed
              </li>
              <li>
                Header shows cumulative scores, <span className="text-sm">👑</span> for the leader
              </li>
            </ul>
          </section>

          {/* Winning */}
          <section>
            <h3 className="mb-1 font-semibold text-gray-900">Winning</h3>
            <p className="text-gray-600">Highest total score after all rounds wins.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
