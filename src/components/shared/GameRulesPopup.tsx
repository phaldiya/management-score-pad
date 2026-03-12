import { useEffect, useState } from 'react';

import { isSuitRed } from '../../lib/gameLogic.ts';
import { CloseIcon, SuitIcon } from './Icons.tsx';

interface GameRulesPopupProps {
  onClose: () => void;
}

const SUITS = ['spades', 'hearts', 'clubs', 'diamonds'] as const;

const TABS = ['Setup', 'Gameplay', 'Scoring'] as const;
type Tab = (typeof TABS)[number];

function TrumpRotationDiagram() {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {SUITS.map((suit, i) => (
        <span key={suit} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className="text-gray-400 text-xs" aria-hidden="true">
              &rarr;
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 rounded-full py-1 pr-1 pl-1.5 sm:pr-2 ${isSuitRed(suit) ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-900'}`}
          >
            <SuitIcon suit={suit} className="h-4 w-4" />
            <span className="hidden font-medium text-xs sm:inline">{suit.charAt(0).toUpperCase() + suit.slice(1)}</span>
          </span>
        </span>
      ))}
      <span className="text-gray-400 text-xs" aria-hidden="true">
        &rarr;
      </span>
      <span className="inline-flex items-center gap-1 font-medium text-gray-400 text-xs">
        &#8635;<span className="hidden sm:inline">Repeat</span>
      </span>
    </div>
  );
}

function SetupTab() {
  return (
    <div className="space-y-4">
      {/* Overview */}
      <section>
        <h3 className="mb-1 font-semibold text-gray-900">Overview</h3>
        <p className="text-gray-600">
          Management/Judgement is a trick-taking card game. Players predict how many tricks they'll win each round. This
          app tracks bids, results, and scores across all rounds.
        </p>
      </section>

      {/* Seating Order */}
      <section>
        <h3 className="mb-1 font-semibold text-gray-900">Seating Order</h3>
        <p className="mb-2 text-gray-600">
          Before the first play, arrange players in <strong>clockwise seating order</strong> using the{' '}
          <span className="inline-block rounded bg-gray-100 px-1 font-medium text-gray-700 text-xs">&larr;</span>{' '}
          <span className="inline-block rounded bg-gray-100 px-1 font-medium text-gray-700 text-xs">&rarr;</span>{' '}
          arrows.
        </p>
        <p className="text-gray-600">This matters because:</p>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-gray-600">
          <li>
            The <strong>dealer</strong>{' '}
            <img
              src={`${import.meta.env.BASE_URL}dealer.png`}
              alt="Dealer badge"
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
              <th scope="col" className="py-1 pr-2 font-medium text-gray-700">
                Players
              </th>
              <th scope="col" className="py-1 pr-2 font-medium text-gray-700">
                Max Cards
              </th>
              <th scope="col" className="py-1 font-medium text-gray-700">
                Total Rounds
              </th>
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
          </tbody>
        </table>
      </section>
    </div>
  );
}

function GameplayTab() {
  return (
    <div className="space-y-4">
      {/* Trump Rotation */}
      <section>
        <h3 className="mb-1 font-semibold text-gray-900">Trump Rotation</h3>
        <p className="mb-2 text-gray-600">Trump suit cycles each round:</p>
        <TrumpRotationDiagram />
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
              alt="Dealer badge"
              className="inline-block h-4 w-4 align-text-bottom"
            />{' '}
            bids last &mdash; total bids <strong>cannot</strong> equal the card count
          </li>
        </ul>
      </section>

      {/* How to Win a Trick */}
      <section>
        <h3 className="mb-1 font-semibold text-gray-900">Winning a Trick / Hand</h3>
        <p className="mb-2 text-gray-600">
          Each trick is one card played by each player. Highest card of the led suit takes the trick.
        </p>
        <ul className="list-disc space-y-1 pl-4 text-gray-600">
          <li>Play a card of the same suit as the first card led (you must follow suit if you can)</li>
          <li>If no trumps are played, highest card of the led suit wins</li>
          <li>Can't follow suit? Play a trump card &mdash; highest trump wins regardless of other cards</li>
          <li>Winner of the trick leads the next one</li>
        </ul>
      </section>
    </div>
  );
}

function ScoringTab() {
  return (
    <div className="space-y-4">
      {/* Scoring */}
      <section>
        <h3 className="mb-2 font-semibold text-gray-900">Scoring</h3>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-gray-200 border-b">
              <th scope="col" className="py-1 pr-2 font-medium text-gray-700">
                Situation
              </th>
              <th scope="col" className="py-1 pr-2 font-medium text-gray-700">
                Points
              </th>
              <th scope="col" className="py-1 font-medium text-gray-700">
                Example
              </th>
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
            Small colored badges: <span className="rounded bg-blue-100 px-1 text-blue-700 text-xs">blue</span> = bid,{' '}
            <span className="rounded bg-green-100 px-1 text-green-700 text-xs">green</span> = result
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
  );
}

export function GameRulesPopup({ onClose }: GameRulesPopupProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Setup');

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-rules-title"
    >
      <div className="w-full max-w-[min(42rem,calc(100vw-40px))] rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-gray-200 border-b px-4 py-3">
          <h2 id="game-rules-title" className="flex items-center gap-1 font-bold text-gray-900">
            Game Rules
            {SUITS.map((s) => (
              <SuitIcon key={s} suit={s} className="h-4 w-4" />
            ))}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-900" aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-gray-200 border-b" role="tablist" aria-label="Game rules sections">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`flex-1 px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === tab ? 'border-red-500 border-b-2 text-red-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4 text-sm" role="tabpanel" aria-label={activeTab}>
          {activeTab === 'Setup' && <SetupTab />}
          {activeTab === 'Gameplay' && <GameplayTab />}
          {activeTab === 'Scoring' && <ScoringTab />}
        </div>
      </div>
    </div>
  );
}
