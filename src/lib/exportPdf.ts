import type { GameRound, Player } from '../types/index.ts';
import { isSuitRed, SUIT_SYMBOLS } from './gameLogic.ts';
import { getCumulativeScore } from './scoreCalculation.ts';

function esc(text: string | number | null): string {
  return String(text ?? '-')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PRINT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; margin: 24px; color: #1e293b; }
  h1 { font-size: 20px; text-align: center; margin-bottom: 16px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: center; vertical-align: middle; }
  thead th { background: #f3f4f6; font-weight: 600; font-size: 14px; }
  .game-col { width: 60px; font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; }
  .cum-score { color: #2563eb; font-size: 12px; font-weight: 500; }
  .card-cell { width: 60px; font-size: 13px; white-space: nowrap; }
  .card-num { font-weight: 700; }
  .suit-red { color: #dc2626; font-size: 16px; }
  .suit-black { color: #111827; font-size: 16px; }
  .score { font-size: 18px; font-weight: 700; margin-bottom: 2px; }
  .bid { background: #dbeafe; color: #1d4ed8; padding: 1px 6px; border-radius: 9999px; }
  .result { background: #d1fae5; color: #047857; padding: 1px 6px; border-radius: 9999px; }
  .sep { color: #d1d5db; margin: 0 2px; }
  .dealer { display: inline-block; width: 14px; height: 14px; vertical-align: middle; margin-right: 3px; }
  .bid-result { font-size: 11px; display: inline-flex; align-items: center; }
  .bg-green { background: #f0fdf4; }
  .bg-red { background: #fef2f2; }
  .bg-yellow { background: #fefce8; }
  @media print {
    body { margin: 12px; }
    @page { margin: 10mm; }
  }
`;

export function printScoreboard(players: Player[], rounds: GameRound[]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  const doc = printWindow.document;

  // Style
  const style = doc.createElement('style');
  style.textContent = PRINT_STYLES;
  doc.head.appendChild(style);

  // Title
  const title = doc.createElement('h1');
  title.textContent = 'Management Score Pad';
  doc.body.appendChild(title);

  // Compute leader
  const lastCompletedIndex = rounds.reduce((acc, r, i) => (r.phase === 'completed' ? i : acc), -1);
  const cumScores =
    lastCompletedIndex >= 0 ? players.map((p) => getCumulativeScore(rounds, p.id, lastCompletedIndex)) : [];
  const maxScore = cumScores.length > 0 ? Math.max(...cumScores) : 0;
  const hasScores = maxScore > 0;

  // Table
  const table = doc.createElement('table');

  // Header
  const thead = doc.createElement('thead');
  const headerRow = doc.createElement('tr');
  const gameHeader = doc.createElement('th');
  gameHeader.className = 'game-col';
  gameHeader.textContent = 'Game';
  headerRow.appendChild(gameHeader);

  players.forEach((p, i) => {
    const th = doc.createElement('th');
    const cumScore = cumScores[i] ?? 0;
    const crown = hasScores && cumScore === maxScore ? '\u{1F451} ' : '';
    const nameSpan = doc.createElement('span');
    nameSpan.textContent = `${crown}${p.name}`;
    th.appendChild(nameSpan);
    th.appendChild(doc.createElement('br'));
    const scoreSpan = doc.createElement('span');
    scoreSpan.className = 'cum-score';
    scoreSpan.textContent = String(cumScore);
    th.appendChild(scoreSpan);
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = doc.createElement('tbody');

  for (const round of rounds) {
    const tr = doc.createElement('tr');

    // Card cell
    const cardTd = doc.createElement('td');
    cardTd.className = 'card-cell';
    const numSpan = doc.createElement('span');
    numSpan.className = 'card-num';
    numSpan.textContent = String(round.cardCount);
    cardTd.appendChild(numSpan);
    cardTd.appendChild(doc.createTextNode(' '));
    const suitSpan = doc.createElement('span');
    suitSpan.className = isSuitRed(round.trump) ? 'suit-red' : 'suit-black';
    suitSpan.textContent = SUIT_SYMBOLS[round.trump];
    cardTd.appendChild(suitSpan);
    tr.appendChild(cardTd);

    // Player cells
    for (const p of players) {
      const td = doc.createElement('td');
      const pd = round.playerData.find((d) => d.playerId === p.id);
      if (!pd) {
        tr.appendChild(td);
        continue;
      }

      const isCompleted = round.phase === 'completed';
      td.className = isCompleted ? (pd.score && pd.score > 0 ? 'bg-green' : 'bg-red') : 'bg-yellow';

      const scoreDiv = doc.createElement('div');
      scoreDiv.className = 'score';
      scoreDiv.textContent = isCompleted ? String(pd.score) : '-';
      td.appendChild(scoreDiv);

      const brDiv = doc.createElement('div');
      brDiv.className = 'bid-result';

      if (pd.isDealer) {
        const dealer = doc.createElement('img');
        dealer.className = 'dealer';
        dealer.src = `${window.location.origin}${import.meta.env.BASE_URL}dealer.png`;
        dealer.alt = 'Dealer';
        brDiv.appendChild(dealer);
      }

      const bidSpan = doc.createElement('span');
      bidSpan.className = 'bid';
      bidSpan.textContent = esc(pd.bid);
      brDiv.appendChild(bidSpan);

      const sep = doc.createElement('span');
      sep.className = 'sep';
      sep.textContent = '/';
      brDiv.appendChild(sep);

      const resultSpan = doc.createElement('span');
      resultSpan.className = 'result';
      resultSpan.textContent = isCompleted ? esc(pd.result) : '-';
      brDiv.appendChild(resultSpan);

      td.appendChild(brDiv);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  doc.body.appendChild(table);

  doc.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
}
