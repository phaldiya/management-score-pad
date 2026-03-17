import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { completedRound, inProgressRound, testPlayers } from '../../tests/helpers/fixtures.ts';

interface MockElement {
  tag: string;
  className: string;
  textContent: string;
  src: string;
  alt: string;
  children: MockElement[];
  appendChild(child: MockElement): void;
}

function createMockElement(tag: string): MockElement {
  const el: MockElement = {
    tag,
    className: '',
    textContent: '',
    src: '',
    alt: '',
    children: [],
    appendChild(child: MockElement) {
      el.children.push(child);
    },
  };
  return el;
}

function createMockPrintWindow() {
  const head = createMockElement('head');
  const body = createMockElement('body');

  const mockDoc = {
    createElement: vi.fn((tag: string) => createMockElement(tag)),
    createTextNode: vi.fn((text: string) => createMockElement(`#text:${text}`)),
    head,
    body,
    close: vi.fn(),
  };

  const mockWindow = {
    document: mockDoc,
    focus: vi.fn(),
    print: vi.fn(),
    close: vi.fn(),
  };

  return { mockWindow, mockDoc };
}

function stubWindow(openReturn: unknown) {
  const openFn = vi.fn(() => openReturn);
  vi.stubGlobal('window', {
    open: openFn,
    setTimeout: globalThis.setTimeout,
    location: { origin: 'http://localhost:3000' },
  });
  return openFn;
}

describe('exportPdf spec', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('window.open is called with ("", "_blank")', async () => {
    const { mockWindow } = createMockPrintWindow();
    const openFn = stubWindow(mockWindow);
    const { printScoreboard } = await import('./exportPdf.ts');
    printScoreboard(testPlayers, [completedRound]);
    expect(openFn).toHaveBeenCalledWith('', '_blank');
  });

  it('returns early when popup is blocked (null)', async () => {
    stubWindow(null);
    const { printScoreboard } = await import('./exportPdf.ts');
    expect(() => printScoreboard(testPlayers, [completedRound])).not.toThrow();
  });

  it('style is appended to head', async () => {
    const { mockWindow, mockDoc } = createMockPrintWindow();
    stubWindow(mockWindow);
    const { printScoreboard } = await import('./exportPdf.ts');
    printScoreboard(testPlayers, [completedRound]);
    const styleChild = mockDoc.head.children.find((c) => c.tag === 'style');
    expect(styleChild).toBeDefined();
    expect(styleChild!.textContent).toContain('border-collapse');
  });

  it('h1 title and table are appended to body', async () => {
    const { mockWindow, mockDoc } = createMockPrintWindow();
    stubWindow(mockWindow);
    const { printScoreboard } = await import('./exportPdf.ts');
    printScoreboard(testPlayers, [completedRound]);
    const h1 = mockDoc.body.children.find((c) => c.tag === 'h1');
    const table = mockDoc.body.children.find((c) => c.tag === 'table');
    expect(h1).toBeDefined();
    expect(h1!.textContent).toBe('Management Score Pad');
    expect(table).toBeDefined();
  });

  it('doc.close is called', async () => {
    const { mockWindow, mockDoc } = createMockPrintWindow();
    stubWindow(mockWindow);
    const { printScoreboard } = await import('./exportPdf.ts');
    printScoreboard(testPlayers, [completedRound]);
    expect(mockDoc.close).toHaveBeenCalled();
  });

  it('focus is called', async () => {
    const { mockWindow } = createMockPrintWindow();
    stubWindow(mockWindow);
    const { printScoreboard } = await import('./exportPdf.ts');
    printScoreboard(testPlayers, [completedRound]);
    expect(mockWindow.focus).toHaveBeenCalled();
  });

  it('print and close are called after 300ms, not before', async () => {
    const { mockWindow } = createMockPrintWindow();
    stubWindow(mockWindow);
    const { printScoreboard } = await import('./exportPdf.ts');
    printScoreboard(testPlayers, [completedRound]);
    expect(mockWindow.print).not.toHaveBeenCalled();
    expect(mockWindow.close).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(mockWindow.print).toHaveBeenCalled();
    expect(mockWindow.close).toHaveBeenCalled();
  });

  it('table header has Game column and player columns', async () => {
    const { mockWindow, mockDoc } = createMockPrintWindow();
    stubWindow(mockWindow);
    const { printScoreboard } = await import('./exportPdf.ts');
    printScoreboard(testPlayers, [completedRound]);
    const table = mockDoc.body.children.find((c) => c.tag === 'table')!;
    const thead = table.children.find((c) => c.tag === 'thead')!;
    const headerRow = thead.children[0];
    expect(headerRow.children[0].textContent).toBe('Game');
    expect(headerRow.children).toHaveLength(1 + testPlayers.length);
  });

  it('leader gets crown emoji prefix in header', async () => {
    const { mockWindow, mockDoc } = createMockPrintWindow();
    stubWindow(mockWindow);
    const { printScoreboard } = await import('./exportPdf.ts');
    printScoreboard(testPlayers, [completedRound]);
    const table = mockDoc.body.children.find((c) => c.tag === 'table')!;
    const thead = table.children.find((c) => c.tag === 'thead')!;
    const headerRow = thead.children[0];
    const aliceTh = headerRow.children[1];
    const nameSpan = aliceTh.children.find((c) => c.tag === 'span' && c.textContent.includes('Alice'));
    expect(nameSpan!.textContent).toContain('\u{1F451}');
  });

  it('table body has one row per round', async () => {
    const { mockWindow, mockDoc } = createMockPrintWindow();
    stubWindow(mockWindow);
    const { printScoreboard } = await import('./exportPdf.ts');
    printScoreboard(testPlayers, [completedRound, inProgressRound]);
    const table = mockDoc.body.children.find((c) => c.tag === 'table')!;
    const tbody = table.children.find((c) => c.tag === 'tbody')!;
    expect(tbody.children).toHaveLength(2);
  });

  it('completed cells get bg-green or bg-red class', async () => {
    const { mockWindow, mockDoc } = createMockPrintWindow();
    stubWindow(mockWindow);
    const { printScoreboard } = await import('./exportPdf.ts');
    printScoreboard(testPlayers, [completedRound]);
    const table = mockDoc.body.children.find((c) => c.tag === 'table')!;
    const tbody = table.children.find((c) => c.tag === 'tbody')!;
    const row = tbody.children[0];
    const p1Cell = row.children[1]; // Alice: score 30 > 0 → bg-green
    const p2Cell = row.children[2]; // Bob: score 0 → bg-red
    expect(p1Cell.className).toBe('bg-green');
    expect(p2Cell.className).toBe('bg-red');
  });

  it('in-progress cells get bg-yellow class', async () => {
    const { mockWindow, mockDoc } = createMockPrintWindow();
    stubWindow(mockWindow);
    const { printScoreboard } = await import('./exportPdf.ts');
    printScoreboard(testPlayers, [inProgressRound]);
    const table = mockDoc.body.children.find((c) => c.tag === 'table')!;
    const tbody = table.children.find((c) => c.tag === 'tbody')!;
    const row = tbody.children[0];
    const p1Cell = row.children[1];
    expect(p1Cell.className).toBe('bg-yellow');
  });

  it('in-progress result shows dash (esc(null) → "-")', async () => {
    const { mockWindow, mockDoc } = createMockPrintWindow();
    stubWindow(mockWindow);
    const { printScoreboard } = await import('./exportPdf.ts');
    printScoreboard(testPlayers, [inProgressRound]);
    const table = mockDoc.body.children.find((c) => c.tag === 'table')!;
    const tbody = table.children.find((c) => c.tag === 'tbody')!;
    const row = tbody.children[0];
    const p1Cell = row.children[1];
    const brDiv = p1Cell.children.find((c) => c.className === 'bid-result');
    const resultSpan = brDiv!.children.find((c) => c.className === 'result');
    expect(resultSpan!.textContent).toBe('-');
  });

  it('no completed rounds → no crown, scores show 0', async () => {
    const { mockWindow, mockDoc } = createMockPrintWindow();
    stubWindow(mockWindow);
    const { printScoreboard } = await import('./exportPdf.ts');
    printScoreboard(testPlayers, [inProgressRound]);
    const table = mockDoc.body.children.find((c) => c.tag === 'table')!;
    const thead = table.children.find((c) => c.tag === 'thead')!;
    const headerRow = thead.children[0];
    for (let i = 1; i < headerRow.children.length; i++) {
      const th = headerRow.children[i];
      const nameSpan = th.children[0];
      expect(nameSpan.textContent).not.toContain('\u{1F451}');
    }
    for (let i = 1; i < headerRow.children.length; i++) {
      const th = headerRow.children[i];
      const scoreSpan = th.children.find((c) => c.className === 'cum-score');
      expect(scoreSpan!.textContent).toBe('0');
    }
  });

  it('empty rounds → header only, no body rows', async () => {
    const { mockWindow, mockDoc } = createMockPrintWindow();
    stubWindow(mockWindow);
    const { printScoreboard } = await import('./exportPdf.ts');
    printScoreboard(testPlayers, []);
    const table = mockDoc.body.children.find((c) => c.tag === 'table')!;
    const tbody = table.children.find((c) => c.tag === 'tbody')!;
    expect(tbody.children).toHaveLength(0);
  });

  it('dealer cell contains dealer image', async () => {
    const { mockWindow, mockDoc } = createMockPrintWindow();
    stubWindow(mockWindow);
    const { printScoreboard } = await import('./exportPdf.ts');
    printScoreboard(testPlayers, [completedRound]);
    const table = mockDoc.body.children.find((c) => c.tag === 'table')!;
    const tbody = table.children.find((c) => c.tag === 'tbody')!;
    const row = tbody.children[0];
    const p1Cell = row.children[1];
    const scoreDiv = p1Cell.children.find((c) => c.className === 'score')!;
    const dealerImg = scoreDiv.children.find((c) => c.className === 'dealer');
    expect(dealerImg).toBeDefined();
    expect(dealerImg!.tag).toBe('img');
    expect(dealerImg!.alt).toBe('Dealer');
  });

  it('non-dealer cells do not contain star', async () => {
    const { mockWindow, mockDoc } = createMockPrintWindow();
    stubWindow(mockWindow);
    const { printScoreboard } = await import('./exportPdf.ts');
    printScoreboard(testPlayers, [completedRound]);
    const table = mockDoc.body.children.find((c) => c.tag === 'table')!;
    const tbody = table.children.find((c) => c.tag === 'tbody')!;
    const row = tbody.children[0];
    const p2Cell = row.children[2];
    const dealerSpan = p2Cell.children.find((c) => c.className === 'dealer');
    expect(dealerSpan).toBeUndefined();
  });
});
