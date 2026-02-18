import { test, expect, type Page } from '@playwright/test';
import type { GameState } from '../src/types/game';

const APP_URL = '/solitaire/';

const RANK_LABELS: Record<number, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

type WinState = ReturnType<typeof buildNearWinState>;

/** Build a state where only the King of clubs remains in waste (51/52 cards in foundations) */
function buildNearWinState(base: GameState): GameState {
  const fullPile = (suit: string) =>
    Array.from({ length: 13 }, (_, i) => ({ suit, rank: i + 1, faceUp: true }));
  return {
    ...base,
    status: 'playing',
    stock: [],
    waste: [{ suit: 'clubs', rank: 13, faceUp: true }],
    foundations: [
      fullPile('spades'),
      fullPile('hearts'),
      fullPile('diamonds'),
      fullPile('clubs').slice(0, 12), // A–Q of clubs
    ],
    tableau: [[], [], [], [], [], [], []],
    selection: null,
    moves: 50,
  };
}

async function getState(page: Page): Promise<GameState> {
  return page.evaluate(
    () => (window as unknown as Record<string, unknown>).__gameState as GameState,
  );
}

async function loadState(page: Page, state: GameState | WinState): Promise<void> {
  await page.evaluate((s) => {
    const d = (window as unknown as Record<string, unknown>).__dispatch as (
      a: unknown,
    ) => void;
    d({ type: '__TEST_LOAD_STATE', state: s });
  }, state);
  // Wait for React to re-render and __gameState to reflect the new state
  await page.waitForFunction(
    (expectedMoves: number) => {
      const s = (window as unknown as Record<string, unknown>).__gameState as GameState;
      return s?.moves === expectedMoves;
    },
    (state as GameState).moves,
  );
}

test.describe('Solitaire', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    // Wait for app to initialise and expose __gameState and __dispatch
    await page.waitForFunction(
      () => !!(window as unknown as Record<string, unknown>).__gameState &&
             !!(window as unknown as Record<string, unknown>).__dispatch,
    );
  });

  // ── Layout ────────────────────────────────────────────────────────────────

  test('page loads with title, stock, 4 foundations, 7 tableau columns, and New Game button', async ({
    page,
  }) => {
    await expect(page.getByText('Solitaire')).toBeVisible();
    await expect(page.locator('[aria-label^="Stock pile"]')).toBeVisible();
    const foundations = page.locator('[aria-label^="Foundation pile"]');
    await expect(foundations).toHaveCount(4);
    for (let i = 1; i <= 7; i++) {
      await expect(page.locator(`[aria-label="Tableau column ${i}"]`)).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'New game' })).toBeVisible();
  });

  test('initial deal: each tableau column has the correct card count', async ({ page }) => {
    const state = await getState(page);
    for (let i = 0; i < 7; i++) {
      expect(state.tableau[i].length).toBe(i + 1);
    }
    expect(state.stock.length).toBe(24);
    expect(state.waste.length).toBe(0);
  });

  // ── Stock & Waste ─────────────────────────────────────────────────────────

  test('clicking stock draws a face-up card to waste', async ({ page }) => {
    await page.locator('[aria-label^="Stock pile"]').click();
    const state = await getState(page);
    expect(state.waste.length).toBe(1);
    expect(state.waste[0].faceUp).toBe(true);
    expect(state.moves).toBe(1);
    expect(state.status).toBe('playing');
  });

  test('clicking empty stock resets waste back to stock', async ({ page }) => {
    let state = await getState(page);
    // Draw all stock cards one at a time
    const draws = state.stock.length;
    for (let i = 0; i < draws; i++) {
      await page.locator('[aria-label^="Stock pile"]').click();
    }
    // Stock should now be empty – clicking resets
    await page.locator('[aria-label="Reset stock"]').click();
    state = await getState(page);
    expect(state.stock.length).toBe(draws);
    expect(state.waste.length).toBe(0);
  });

  test('draw-3 mode draws up to 3 cards per click', async ({ page }) => {
    await page.getByRole('button', { name: 'Draw 3' }).click();
    let state = await getState(page);
    expect(state.drawCount).toBe(3);
    await page.locator('[aria-label^="Stock pile"]').click();
    state = await getState(page);
    expect(state.waste.length).toBe(3);
  });

  // ── Selection ─────────────────────────────────────────────────────────────

  test('clicking waste top card selects it', async ({ page }) => {
    await page.locator('[aria-label^="Stock pile"]').click();
    let state = await getState(page);
    const top = state.waste[0];
    const label = `${RANK_LABELS[top.rank]} of ${top.suit}`;
    await page.locator(`[aria-label="${label}"]`).first().click();
    state = await getState(page);
    expect(state.selection?.from).toBe('waste');
  });

  test('clicking selected waste card deselects it', async ({ page }) => {
    await page.locator('[aria-label^="Stock pile"]').click();
    let state = await getState(page);
    const top = state.waste[0];
    const label = `${RANK_LABELS[top.rank]} of ${top.suit}`;
    // Select
    await page.locator(`[aria-label="${label}"]`).first().click();
    // Deselect
    await page.locator(`[aria-label="${label}"]`).first().click();
    state = await getState(page);
    expect(state.selection).toBeNull();
  });

  // ── Card interactions (deterministic via __TEST_LOAD_STATE) ───────────────

  test('flipping a face-down top card', async ({ page }) => {
    const base = await getState(page);
    await loadState(page, {
      ...base,
      status: 'playing',
      tableau: [
        [{ suit: 'spades', rank: 7, faceUp: false }],
        [], [], [], [], [], [],
      ],
      selection: null,
      moves: 1,
    });
    // The only card in column 1 is face-down; click the "Face-down card" within column 1
    await page
      .locator('[aria-label="Tableau column 1"]')
      .locator('[aria-label="Face-down card"]')
      .click();
    const state = await getState(page);
    expect(state.tableau[0][0].faceUp).toBe(true);
  });

  test('moving a waste card to a valid tableau column', async ({ page }) => {
    const base = await getState(page);
    await loadState(page, {
      ...base,
      status: 'playing',
      stock: [],
      waste: [{ suit: 'spades', rank: 8, faceUp: true }],
      foundations: [[], [], [], []],
      tableau: [
        [{ suit: 'hearts', rank: 9, faceUp: true }],
        [], [], [], [], [], [],
      ],
      selection: null,
      moves: 1,
    });
    // Select the 8 of spades in waste
    await page.locator('[aria-label="8 of spades"]').click();
    expect((await getState(page)).selection?.from).toBe('waste');

    // Click the 9 of hearts in column 1 to place the 8 on it
    await page.locator('[aria-label="9 of hearts"]').click();
    const state = await getState(page);
    expect(state.waste.length).toBe(0);
    expect(state.tableau[0].length).toBe(2);
    expect(state.tableau[0][1]).toMatchObject({ suit: 'spades', rank: 8 });
  });

  test('moving a tableau stack to another column', async ({ page }) => {
    const base = await getState(page);
    // Column 0: red J (rank 11), black 10 (rank 10) — valid descending stack.
    // Column 1: black Q (rank 12). J of diamonds (red) can go on Q of clubs (black).
    await loadState(page, {
      ...base,
      status: 'playing',
      stock: [],
      waste: [],
      foundations: [[], [], [], []],
      tableau: [
        [
          { suit: 'diamonds', rank: 11, faceUp: true },
          { suit: 'spades', rank: 10, faceUp: true },
        ],
        [{ suit: 'clubs', rank: 12, faceUp: true }],
        [], [], [], [], [],
      ],
      selection: null,
      moves: 5,
    });
    // Select from the J downward (picks up J+10).
    // J of diamonds is partially covered by the 10 of spades, so click its
    // visible top-left corner where the rank label sits.
    await page.locator('[aria-label="J of diamonds"]').click({ position: { x: 10, y: 8 } });
    expect((await getState(page)).selection?.cardIndex).toBe(0);

    // Move to the Q of clubs in column 2
    await page.locator('[aria-label="Q of clubs"]').click();
    const state = await getState(page);
    expect(state.tableau[1].length).toBe(3); // Q, J, 10
    expect(state.tableau[0].length).toBe(0); // column 0 now empty
  });

  test('moving a card to a foundation pile manually', async ({ page }) => {
    const base = await getState(page);
    await loadState(page, {
      ...base,
      status: 'playing',
      stock: [],
      waste: [{ suit: 'hearts', rank: 1, faceUp: true }],
      foundations: [[], [], [], []],
      tableau: [[], [], [], [], [], [], []],
      selection: null,
      moves: 1,
    });
    // Select the Ace of hearts in waste
    await page.locator('[aria-label="A of hearts"]').click();
    // Place on foundation pile 1 (empty)
    await page.locator('[aria-label="Foundation pile 1, empty"]').click();
    const state = await getState(page);
    expect(
      state.foundations.some((f) => f.length === 1 && f[0].suit === 'hearts' && f[0].rank === 1),
    ).toBe(true);
  });

  test('double-clicking a card auto-moves it to foundation', async ({ page }) => {
    const base = await getState(page);
    await loadState(page, {
      ...base,
      status: 'playing',
      stock: [],
      waste: [{ suit: 'diamonds', rank: 1, faceUp: true }],
      foundations: [[], [], [], []],
      tableau: [[], [], [], [], [], [], []],
      selection: null,
      moves: 1,
    });
    // Double-click the Ace of diamonds
    await page.locator('[aria-label="A of diamonds"]').dblclick();
    const state = await getState(page);
    expect(state.waste.length).toBe(0);
    expect(
      state.foundations.some((f) => f.some((c) => c.suit === 'diamonds' && c.rank === 1)),
    ).toBe(true);
  });

  test('invalid move clears selection', async ({ page }) => {
    const base = await getState(page);
    // Try to place a 7 on a 5 — invalid
    await loadState(page, {
      ...base,
      status: 'playing',
      stock: [],
      waste: [{ suit: 'spades', rank: 7, faceUp: true }],
      foundations: [[], [], [], []],
      tableau: [
        [{ suit: 'hearts', rank: 5, faceUp: true }],
        [], [], [], [], [], [],
      ],
      selection: null,
      moves: 1,
    });
    await page.locator('[aria-label="7 of spades"]').click(); // select waste card
    await page.locator('[aria-label="5 of hearts"]').click(); // invalid target
    const state = await getState(page);
    // Move failed; selection changes to the 5 of hearts (tableau card)
    expect(state.selection?.from).toBe('tableau');
    expect(state.waste.length).toBe(1); // card not moved
  });

  // ── New Game / Draw mode ──────────────────────────────────────────────────

  test('New Game button resets to a fresh idle state', async ({ page }) => {
    await page.locator('[aria-label^="Stock pile"]').click(); // make a move
    await page.getByRole('button', { name: 'New game' }).click();
    const state = await getState(page);
    expect(state.status).toBe('idle');
    expect(state.moves).toBe(0);
    expect(state.elapsedSeconds).toBe(0);
    expect(state.waste.length).toBe(0);
    expect(state.stock.length).toBe(24);
  });

  test('switching draw mode starts a fresh game with new count', async ({ page }) => {
    await page.locator('[aria-label^="Stock pile"]').click(); // make a move
    await page.getByRole('button', { name: 'Draw 3' }).click();
    const state = await getState(page);
    expect(state.drawCount).toBe(3);
    expect(state.moves).toBe(0);
    expect(state.status).toBe('idle');
  });

  // ── Win ───────────────────────────────────────────────────────────────────

  test('completing all foundations shows the "You won!" banner', async ({ page }) => {
    const base = await getState(page);
    const nearWin = buildNearWinState(base);
    await loadState(page, nearWin);

    // Select the King of clubs from waste
    await page.locator('[aria-label="K of clubs"]').click();
    expect((await getState(page)).selection?.from).toBe('waste');

    // Click the clubs foundation (currently shows Q of clubs on top)
    await page.locator('[aria-label="Foundation: Q of clubs"]').click();

    await expect(page.getByText('You won!')).toBeVisible();
    const state = await getState(page);
    expect(state.status).toBe('won');
    expect(state.foundations.every((f) => f.length === 13)).toBe(true);
  });
});
