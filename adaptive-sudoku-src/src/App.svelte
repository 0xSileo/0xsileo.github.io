<script>
  import { onMount, onDestroy } from 'svelte';

  // ---------- Constants ----------
  const BOX = 3;
  const SIZE = BOX * BOX;
  const TOTAL_CELLS = SIZE * SIZE;

  const ALPHABETS = {
    2: [1,2,3,4],
    3: [1,2,3,4,5,6,7,8,9],
    4: ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P"]
  }

  const DIGITS = ALPHABETS[BOX]

  const MINIMA = {
    2: 4,
    3: 17,
    4: 50,
  }

  const MIN_GIVEN_NUMBER = MINIMA[BOX] //Yields 4 when SIZE = 4 and 17 when SIZE = 9

  const MAX_GIVEN_NUMBER = TOTAL_CELLS-1

  const DEFAULTS =  {2:8,3:25,4:60};

  const DEFAULT_GIVEN_NUMBER = DEFAULTS[BOX];

  let TARGET_GIVENS = DEFAULT_GIVEN_NUMBER
  let nextGameGivens = TARGET_GIVENS
  let PENALTY_REMOVED = SIZE==9 ? 3 : 2

  const SOLUTION_GENERATION_TIMEOUT_MS = 2000;
  const MAX_GENERATION_ATTEMPTS = 50;
  const UNIQUENESS_CHECK_LIMIT = 2;
  const UNIQUENESS_NODE_BUDGET = 60000;
  const MAX_UNIQUENESS_FIX_ATTEMPTS = 40;

  const GIVEN_FLASH_MS = 900;
  const WRONG_FLASH_MS = 550;

  // ---------- Pure grid helpers ----------

  function emptyGrid() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  }

  function cloneGrid(grid) {
    return grid.map(row => row.slice());
  }

  function shuffled(arr) {
    const result = arr.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function keyOf(r, c) {
    return `${r},${c}`;
  }

  /** Whether placing `num` at (row, col) breaks Sudoku's row/column/box rules. */
  function isValidPlacement(grid, row, col, num) {
    for (let c = 0; c < SIZE; c++) if (grid[row][c] === num) return false;
    for (let r = 0; r < SIZE; r++) if (grid[r][col] === num) return false;

    const boxRow = Math.floor(row / BOX) * BOX;
    const boxCol = Math.floor(col / BOX) * BOX;
    for (let r = boxRow; r < boxRow + BOX; r++) {
      for (let c = boxCol; c < boxCol + BOX; c++) {
        if (grid[r][c] === num) return false;
      }
    }
    return true;
  }

  /**
   * Finds the empty cell with the fewest valid candidates (the "minimum
   * remaining values" heuristic) — this keeps backtracking fast. If a cell
   * has zero candidates the grid can't be solved from here, so we return
   * immediately instead of finishing the scan; the caller backtracks either way.
   */
  function findNextCell(grid) {
    let best = null;
    let bestCount = SIZE + 1; // sentinel: higher than any real candidate count

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] !== 0) continue;

        let count = 0;
        for (const n of DIGITS) {
          if (isValidPlacement(grid, r, c, n)) count++;
        }

        if (count < bestCount) {
          bestCount = count;
          best = [r, c];
          if (count === 0) return best;
        }
      }
    }
    return best;
  }

  /** Backtracking solver. Mutates `grid` in place; returns true on success. */
  function fillGrid(grid, deadline) {
    if (deadline && Date.now() > deadline) return false;

    const cell = findNextCell(grid);
    if (!cell) return true; // no empty cells left -> solved

    const [r, c] = cell;
    for (const n of shuffled(DIGITS)) {
      if (!isValidPlacement(grid, r, c, n)) continue;
      grid[r][c] = n;
      if (fillGrid(grid, deadline)) return true;
      grid[r][c] = 0;
    }
    return false;
  }

  /**
   * Counts distinct solutions for `grid`, stopping once `limit` is reached
   * or `nodeBudget` search nodes have been explored. Hitting the budget
   * reports "at least 2" so callers treat it as ambiguous rather than
   * mistakenly calling it unique.
   */
  function countSolutions(grid, limit, nodeBudget) {
    const g = cloneGrid(grid);
    let count = 0;
    let nodes = 0;

    function search() {
      if (count >= limit) return;
      nodes++;
      if (nodes > nodeBudget) {
        count = Math.max(count, 2);
        return;
      }

      const cell = findNextCell(g);
      if (!cell) {
        count++;
        return;
      }

      const [r, c] = cell;
      for (const n of DIGITS) {
        if (count >= limit) return;
        if (!isValidPlacement(g, r, c, n)) continue;
        g[r][c] = n;
        search();
        g[r][c] = 0;
      }
    }

    search();
    return count;
  }

  /** Builds an returns a full solved grid that respects every cell in `fixedCells`. */
  function generateFullSolution(fixedCells) {
    const deadline = Date.now() + SOLUTION_GENERATION_TIMEOUT_MS;

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      console.log("eh")
      const grid = emptyGrid();
      let valid = true;
      for (const { r, c, v } of fixedCells) {
        if (!isValidPlacement(grid, r, c, v)) {
          valid = false;
          break;
        }
        grid[r][c] = v;
      }
      if (valid && fillGrid(grid, deadline)) return grid;
    }
    return null;
  }

  /**
   * Builds a puzzle from `solution`: every cell in `mustKeepCoords` is
   * revealed, plus enough extra cells to reach `targetGivens` reveals total,
   * while keeping the puzzle's solution unique whenever possible.
   * Returns the Set of revealed cell keys.
   */
  function buildPuzzle(solution, mustKeepCoords, targetGivens) {
    const mustKeepKeys = new Set(mustKeepCoords.map(([r, c]) => keyOf(r, c)));
    const allCoords = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!mustKeepKeys.has(keyOf(r, c))) allCoords.push([r, c]);
      }
    }
    const candidates = shuffled(allCoords);
    const givenKeys = new Set(mustKeepKeys);

    const gridFromKeys = keys => {
      const grid = emptyGrid();
      for (const key of keys) {
        const [r, c] = key.split(',').map(Number);
        grid[r][c] = solution[r][c];
      }
      return grid;
    };

    for (const [r, c] of candidates) {
      if (givenKeys.size >= targetGivens) break;
      givenKeys.add(keyOf(r, c));
    }

    for (let attempt = 0; attempt < MAX_UNIQUENESS_FIX_ATTEMPTS; attempt++) {
      const grid = gridFromKeys(givenKeys);
      const solutionCount = countSolutions(grid, UNIQUENESS_CHECK_LIMIT, UNIQUENESS_NODE_BUDGET);
      if (solutionCount <= 1) break;

      const remaining = candidates.filter(([r, c]) => !givenKeys.has(keyOf(r, c)));
      if (remaining.length === 0) break;

      if (givenKeys.size < targetGivens) {
        const [r, c] = remaining[0];
        givenKeys.add(keyOf(r, c));
        continue;
      }

      // Already at the target size: swap a non-mandatory given for a fresh
      // candidate, hoping that resolves the ambiguity.
      const swappable = Array.from(givenKeys).filter(k => !mustKeepKeys.has(k));
      if (swappable.length === 0) break; // can't fix this without breaking mustKeep

      const swapOut = swappable[Math.floor(Math.random() * swappable.length)];
      givenKeys.delete(swapOut);
      const [r, c] = remaining[Math.floor(Math.random() * remaining.length)];
      givenKeys.add(keyOf(r, c));
    }

    return givenKeys;
  }

  // ---------- Game state (the only state that's mutated directly) ----------

  let solution = emptyGrid();
  let givenSetKeys = new Set();
  let confirmedKeys = new Set();
  let flashGivenKeys = new Set();
  let wrongEntries = new Map(); // key -> { num, id }
  let selected = { r: -1, c: -1 };
  let wonGame = false;

  // DOM refs per cell, so keyboard navigation can move native focus in
  // lockstep with the logical `sele
  // cted` coordinate.
  let cellRefs = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

  $: totalFreeCells = TOTAL_CELLS - TARGET_GIVENS;

  // Each flash/highlight event gets a unique id (so CSS animations restart),
  // and `gameId` acts as a cancellation token for in-flight setTimeouts —
  // see scheduleGivenFlash/flashWrong below.
  let flashCounter = 0;
  let givenFlashId = 0;
  let gameId = 0;

  // ---------- Timer state ----------
  let timerStart = 0;       // performance.now() when current game started
  let lastCorrectTime = 0;  // performance.now() at the last correct guess (or game start)
  let elapsedMs = 0;        // live elapsed time, updated on a tick
  let timerHandle = null;

  // Each entry is { n: attemptIndex, dt: secondsSinceLastCorrect }
  let timingPoints = [];

  function startTimer() {
    stopTimer();
    timerStart = performance.now();
    lastCorrectTime = timerStart;
    elapsedMs = 0;
    timingPoints = [];
    timerHandle = setInterval(() => {
      elapsedMs = performance.now() - timerStart;
    }, 100);
  }

  function stopTimer() {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
  }

  onDestroy(stopTimer);

  function recordCorrectGuess() {
    const now = performance.now();
    const dtSeconds = (now - lastCorrectTime) / 1000;
    lastCorrectTime = now;
    timingPoints = [...timingPoints, { n: timingPoints.length + 1, dt: dtSeconds }];
  }

  function formatElapsed(ms) {
    const totalSeconds = Math.floor(ms / 100) / 10;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(1);
    return `${minutes}:${seconds.padStart(4, '0')}`;
  }

  // ---------- Derived state ----------
  // cellMeta and displayGrid used to be hand-mutated in several places —
  // exactly how stale state survives a "New Game". Deriving them from the
  // state above means there's nothing to remember to reset; they're
  // rebuilt from scratch whenever a dependency changes.

  $: cellMeta = buildCellMeta(
    confirmedKeys, givenSetKeys, flashGivenKeys,
    wrongEntries, givenFlashId
  );
  $: displayGrid = buildDisplayGrid(solution, givenSetKeys, confirmedKeys, wrongEntries);
  $: progressCount = confirmedKeys.size;
  $: emptyRemaining = Math.max(0, totalFreeCells - progressCount);
  $: progressPct = totalFreeCells > 0 ? Math.min(100, (progressCount / totalFreeCells) * 100) : 100;
  // Uncomment the next line to allow the player to change the difficulty mid-game. I think it's more entertaining to have set constraints
  // $: adaptPuzzle(TARGET_GIVENS);

  function buildCellMeta(confirmed, givens, flashGivens, wrongEntries, givenFlashId) {
    return Array.from({ length: SIZE }, (_, r) =>
      Array.from({ length: SIZE }, (_, c) => {
        const k = keyOf(r, c);

        if (confirmed.has(k)) {
          return { type: 'confirmed', id: 0, flash: false };
        }

        if (givens.has(k)) {
          const isFlash = flashGivens.has(k);
          return { type: 'given', id: isFlash ? givenFlashId : 0, flash: isFlash };
        }

        if (wrongEntries.has(k)) {
          return { type: 'wrong', id: wrongEntries.get(k).id, flash: false };
        }
        
        return { type: 'empty', id: 0, flash: false };
      })
    );
  }

  function buildDisplayGrid(solution, givens, confirmed, wrongEntries) {
    const grid = emptyGrid();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const k = keyOf(r, c);
        if (confirmed.has(k) || givens.has(k)) {
          grid[r][c] = solution[r][c];
        } else if (wrongEntries.has(k)) {
          grid[r][c] = wrongEntries.get(k).num;
        }
      }
    }
    return grid;
  }

  // ---------- Actions ----------

  function startNewGame(nextGameGivens=TARGET_GIVENS) {
    gameId += 1;
    const myGameId = gameId;

    selected = { r: -1, c: -1 };
    wonGame = false;
    confirmedKeys = new Set();
    wrongEntries = new Map();

    solution = generateFullSolution([]) ?? emptyGrid();
    const givens = buildPuzzle(solution, [], nextGameGivens);

    givenSetKeys = givens;
    TARGET_GIVENS = givens.size;
    totalFreeCells = TOTAL_CELLS - givens.size;

    startTimer();

    scheduleGivenFlash(myGameId, givens);

    // Auto-select + focus the first empty cell so keyboard play works immediately.
    const [r0, c0] = findNextSelectable(0, 0, 0, 0);
    const k0 = keyOf(r0, c0);
    if (!givens.has(k0)) {
      selected = { r: r0, c: c0 };
    } else {
      const [r1, c1] = findNextSelectable(0, -1, 0, 1);
      selected = givens.has(keyOf(r1, c1)) ? { r: -1, c: -1 } : { r: r1, c: c1 };
    }
    // Defer focus to after the DOM has re-rendered the new board.
    setTimeout(() => {
      if (gameId !== myGameId) return;
      if (selected.r >= 0) focusCell(selected.r, selected.c);
    }, 0);
  }

  function handleNumberInput(r, c, num) {
    const k = keyOf(r, c);
    if (givenSetKeys.has(k) || confirmedKeys.has(k)) return;

    if (num !== solution[r][c]) {
      flashWrong(r, c, num);
      TARGET_GIVENS = Math.max(MIN_GIVEN_NUMBER, TARGET_GIVENS-PENALTY_REMOVED)
      adaptPuzzle()
      return;
    }

    confirmedKeys.add(k);
    confirmedKeys = new Set(confirmedKeys);

    recordCorrectGuess();

    if (confirmedKeys.size === totalFreeCells) {
      wonGame = true;
      stopTimer();
      return;
    }

    adaptPuzzle();
  }

  /** Re-solves the board around every confirmed cell and deals a fresh set of givens. */
  function adaptPuzzle() {
    const myGameId = gameId;
    const mustKeepCoords = Array.from(confirmedKeys).map(k => k.split(',').map(Number));
    const fixedCells = mustKeepCoords.map(([r, c]) => ({ r, c, v: solution[r][c] }));

    solution = generateFullSolution(fixedCells) ?? solution;

    const target = TARGET_GIVENS + mustKeepCoords.length;
    const givens = buildPuzzle(solution, mustKeepCoords, target);
    givenSetKeys = givens;

    const freshGivens = new Set(Array.from(givens).filter(gk => !confirmedKeys.has(gk)));
    scheduleGivenFlash(myGameId, freshGivens);
  }

  function scheduleGivenFlash(forGameId, keys) {
    const id = ++flashCounter;
    givenFlashId = id;
    flashGivenKeys = new Set(keys);

    setTimeout(() => {
      if (gameId !== forGameId) return; // a newer game has started — ignore
      if (givenFlashId !== id) return; // a newer flash batch has started — ignore
      flashGivenKeys = new Set();
    }, GIVEN_FLASH_MS);
  }

  function flashWrong(r, c, num) {
    const k = keyOf(r, c);
    const forGameId = gameId;
    const id = ++flashCounter;

    wrongEntries.set(k, { num, id });
    wrongEntries = new Map(wrongEntries);

    setTimeout(() => {
      if (gameId !== forGameId) return; // a newer game has started — ignore
      if (wrongEntries.get(k)?.id !== id) return; // this cell already moved on
      wrongEntries.delete(k);
      wrongEntries = new Map(wrongEntries);
    }, WRONG_FLASH_MS);
  }

  function selectCell(r, c) {
    const k = keyOf(r, c);
    if (givenSetKeys.has(k) || confirmedKeys.has(k)) return;
    selected = { r, c };
    // Keep native DOM focus in sync with logical selection so the two
    // never disagree (e.g. after Tab-ing then clicking, or vice versa).
    focusCell(r, c);
  }

  /** Tab (native focus) landing on a cell should also become the logical selection,
   * so a subsequent digit keypress lands where the player actually tabbed to. */
  function onCellFocus(r, c) {
    const k = keyOf(r, c);
    if (givenSetKeys.has(k) || confirmedKeys.has(k)) return;
    selected = { r, c };
  }

  function pickNumber(num) {
    if (selected.r < 0) return;
    handleNumberInput(selected.r, selected.c, num);
  }

  /** Finds the next selectable (non-given, non-confirmed) cell stepping by (dr, dc), wrapping at edges. */
  function findNextSelectable(r, c, dr, dc) {
    let nr = r, nc = c;
    for (let i = 0; i < TOTAL_CELLS; i++) {
      nr = (nr + dr + SIZE) % SIZE;
      nc = (nc + dc + SIZE) % SIZE;
      const k = keyOf(nr, nc);
      if (!givenSetKeys.has(k) && !confirmedKeys.has(k)) return [nr, nc];
      // If moving purely horizontally/vertically didn't change row/col (e.g. dr=0),
      // stepping wraps within the same row/col; loop still terminates after SIZE tries.
      if (dr === 0 && dc === 0) break;
    }
    return [r, c];
  }

  function focusCell(r, c) {
    const el = cellRefs[r]?.[c];
    if (el) el.focus();
  }

  function moveSelection(dr, dc) {
    const startR = selected.r < 0 ? 0 : selected.r;
    const startC = selected.c < 0 ? 0 : selected.c;
    const [nr, nc] = findNextSelectable(startR, startC, dr, dc);
    selected = { r: nr, c: nc };
    focusCell(nr, nc);
  }

  function onKeydown(e) {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveSelection(-1, 0);
        return;
      case 'ArrowDown':
        e.preventDefault();
        moveSelection(1, 0);
        return;
      case 'ArrowLeft':
        e.preventDefault();
        moveSelection(0, -1);
        return;
      case 'ArrowRight':
        e.preventDefault();
        moveSelection(0, 1);
        return;
    }

    if (selected.r < 0) return;
    if (e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      handleNumberInput(selected.r, selected.c, parseInt(e.key, 10));
    }
  }

  onMount(startNewGame);

  // ---------- Template helpers ----------

  function cellClasses(r, c) {
    const meta = cellMeta[r]?.[c] ?? { type: 'empty' };
    const classes = ['cell', `type-${meta.type}`];
    if (selected.r === r && selected.c === c) classes.push('cell-selected');
    if (c % BOX === 0) classes.push('border-l-thick');
    if (c === SIZE - 1) classes.push('border-r-thick');
    if (r % BOX === 0) classes.push('border-t-thick');
    if (r === SIZE - 1) classes.push('border-b-thick');
    return classes.join(' ');
  }

  function numColor(r, c) {
    const meta = cellMeta[r]?.[c] ?? { type: 'empty' };
    switch (meta.type) {
      case 'given': return 'var(--given-color)';
      case 'confirmed': return 'var(--confirmed-color)';
      case 'wrong': return 'var(--wrong-color)';
      default: return 'var(--container-text)';
    }
  }

  // ---------- Timing graph ----------

  const graphWidth = 480;
  const graphHeight = 220;
  const graphMargin = { top: 16, right: 16, bottom: 32, left: 44 };

  const X_TICK_COUNT = 5; 
  const Y_TICK_COUNT = 5; // equally spaced horizontal gridlines/ticks

  $: plotW = graphWidth - graphMargin.left - graphMargin.right;
  $: plotH = graphHeight - graphMargin.top - graphMargin.bottom;

  // X domain: always at least 1 so a fresh game still shows axis lines
  $: xMax = Math.max(timingPoints.length, 1);

  // Y domain: based on max dt seen so far, with a sane minimum span and headroom
  $: yMaxRaw = timingPoints.length ? Math.max(...timingPoints.map(p => p.dt)) : 1;
  $: yMax = Math.max(yMaxRaw * 1.15, 1);


  $: X_TICK_STEP = Math.max(1, Math.min(20, X_TICK_STEP));

  function xScale(n) {
    if (xMax <= 1) return graphMargin.left + plotW / 2;
    return graphMargin.left + (n / xMax) * plotW;
  }

  function yScale(dt) {
    return graphMargin.top + plotH - (dt / yMax) * plotH;
  }

  $: linePoints = timingPoints
    .map(p => `${xScale(p.n)},${yScale(p.dt)}`)
    .join(' ');

  // Evenly spaced Y ticks across [0, yMax]
  $: yTicks = Array.from({ length: Y_TICK_COUNT + 1 }, (_, i) => {
    const val = (yMax / Y_TICK_COUNT) * i;
    return { val, y: yScale(val) };
  });

  $: xTicks = Array.from({ length: X_TICK_COUNT + 1 }, (_, i) => {
    const val = (xMax / X_TICK_COUNT) * i;
    return { val, x: xScale(val) };
  });


  // ---------- Density (distribution of dt values) ----------
  // Gaussian KDE over the dt samples — gives a smooth distribution shape
  // even with very few points, rather than a jagged/sparse histogram.

  const densityWidth = 480;
  const densityHeight = 180;
  const densityMargin = { top: 14, right: 16, bottom: 32, left: 44 };
  const DENSITY_SAMPLES = 120; // resolution of the smooth curve
  const DENSITY_Y_TICKS = 4;

  $: dPlotW = densityWidth - densityMargin.left - densityMargin.right;
  $: dPlotH = densityHeight - densityMargin.top - densityMargin.bottom;

  $: dtValues = timingPoints.map(p => p.dt);

  /** Silverman's rule-of-thumb bandwidth, with sane fallbacks for tiny/degenerate samples. */
  function silvermanBandwidth(values) {
    const n = values.length;
    if (n < 2) return 1;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const sd = Math.sqrt(variance);
    if (sd === 0) return Math.max(values[0] * 0.2, 0.1);
    return 1.06 * sd * Math.pow(n, -1 / 5);
  }

  function gaussianKernel(u) {
    return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
  }

  /** Evaluates a Gaussian KDE at `x` for the given samples/bandwidth. */
  function kdeAt(x, values, bandwidth) {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, v) => acc + gaussianKernel((x - v) / bandwidth), 0);
    return sum / (values.length * bandwidth);
  }

  $: densityDomainMax = dtValues.length ? Math.max(...dtValues) : 1;
  $: bandwidth = silvermanBandwidth(dtValues);
  // Pad the x-domain by ~3 bandwidths on each side so the curve's tails are visible.
  $: densityXMax = Math.max(densityDomainMax + bandwidth * 3, bandwidth * 3, 1);

  $: densityCurve = (() => {
    if (dtValues.length === 0) return [];
    const pts = [];
    for (let i = 0; i <= DENSITY_SAMPLES; i++) {
      const x = (i / DENSITY_SAMPLES) * densityXMax;
      const y = kdeAt(x, dtValues, bandwidth);
      pts.push({ x, y });
    }
    return pts;
  })();

  $: densityYMax = densityCurve.length ? Math.max(...densityCurve.map(p => p.y)) * 1.15 || 1 : 1;

  function dxScale(x) {
    return densityMargin.left + (x / densityXMax) * dPlotW;
  }
  function dyScale(y) {
    return densityMargin.top + dPlotH - (y / densityYMax) * dPlotH;
  }

  $: densityLinePoints = densityCurve.map(p => `${dxScale(p.x)},${dyScale(p.y)}`).join(' ');
  $: densityAreaPoints = densityCurve.length
    ? `${dxScale(0)},${dyScale(0)} ` + densityLinePoints + ` ${dxScale(densityXMax)},${dyScale(0)}`
    : '';

  // Rug marks: small ticks on the x-axis showing each actual sample
  $: rugTicks = dtValues.map(v => dxScale(v));

  $: densityXTicks = (() => {
    const ticks = [];
    const count = 5;
    for (let i = 0; i <= count; i++) {
      const val = (densityXMax / count) * i;
      ticks.push({ val, x: dxScale(val) });
    }
    return ticks;
  })();

  $: densityYTicks = Array.from({ length: DENSITY_Y_TICKS + 1 }, (_, i) => {
    const val = (densityYMax / DENSITY_Y_TICKS) * i;
    return { val, y: dyScale(val) };
  });

</script>

<svelte:window on:keydown={onKeydown} />
<div class="page">
  <div class="container">
    <header>
      <!--<h1>A totally innocent sudoku game...</h1>-->
      <h1>Adaptive Sudoku</h1>
      <p class="subtitle">On every guess the Sudoku evolves. A correct guess locks in until the end of the game and a wrong guess flashes red and disappears but removes {PENALTY_REMOVED} numbers from the grid.</p>
    </header>
    <div class="status-bar">
      <div class="progress-wrap">
        <div class="progress-track">
          <div class="progress-fill" style="width: {progressPct}%"></div>
        </div>
        <span class="progress-label">{progressCount}/{TOTAL_CELLS - TARGET_GIVENS}</span>
      </div>
      <div class="timer-display">⏱ {formatElapsed(elapsedMs)}</div>
    </div>
  
    <div class="board" class:won={wonGame} style={`--size: ${SIZE};`}>
      {#each displayGrid as row, r}
        {#each row as val, c}
          <div
            bind:this={cellRefs[r][c]}
            class={cellClasses(r, c)}
            on:click={() => selectCell(r, c)}
            on:focus={() => onCellFocus(r, c)}
            role="button"
            tabindex="0"
            aria-label="cell {r} {c}"
          >
            {#if val !== 0}
              <span class="num" style="color: {numColor(r, c)}">{val}</span>
            {/if}
          </div>
        {/each}
      {/each}
      {#if wonGame}
        <div class="win-overlay">
          <div class="win-card">
            <div class="win-title">Good job! 🎉</div>
            <div class="win-time">Final time: {formatElapsed(elapsedMs)}</div>
            <button class="general-btn" on:click={() => startNewGame()}>
              Play Again
            </button>
          </div>
        </div>
      {/if}
    </div>

    <div class="legend">
      <span class="legend-item"><i class="dot dot-blue"></i> {TARGET_GIVENS} Givens</span>
      <span class="legend-item"><i class="dot dot-green"></i> Correct guesses</span>
      <span class="legend-item"><i class="dot dot-red"></i>Wrong guesses</span>
    </div>

    <div class="numpad" style={`--numpadsize: ${SIZE};`}>
      {#each DIGITS as n}
        <button class="num-btn" on:click={() => pickNumber(n)}>{n}</button>
      {/each}
    </div>

      <p class="subtitle">Use the slider to adjust the amount of given numbers, the default is {DEFAULT_GIVEN_NUMBER}.</p>

    <input
      type="range"
      bind:value={nextGameGivens}
      min="{MIN_GIVEN_NUMBER}"
      max="{MAX_GIVEN_NUMBER}"
      step="1"
    />

    <button class="general-btn" on:click={() => {startNewGame(nextGameGivens)}}>New game with  {nextGameGivens} givens</button>

    <!-- ---------- Timing graph ---------- -->
    <div class="graph-section">
      <div class="graph-header">
        <h2>Time between correct guesses</h2>
      </div>

      <svg width={graphWidth} height={graphHeight} class="timing-svg">
        <!-- horizontal gridlines + y ticks -->
        {#each yTicks as t}
          <line
            x1={graphMargin.left}
            y1={t.y}
            x2={graphWidth - graphMargin.right}
            y2={t.y}
            stroke="var(--grid-line)"
            stroke-width="1"
          />
          <text
            x={graphMargin.left - 8}
            y={t.y}
            text-anchor="end"
            dominant-baseline="middle"
            class="axis-label"
          >{t.val.toFixed(1)}s</text>
        {/each}

        <!-- x ticks -->
        {#each xTicks as t}
          <line
            x1={t.x}
            y1={graphMargin.top + plotH}
            x2={t.x}
            y2={graphMargin.top + plotH + 5}
            stroke="var(--axis-line)"
            stroke-width="1"
          />
          <text
            x={t.x}
            y={graphMargin.top + plotH + 18}
            text-anchor="middle"
            class="axis-label"
          >{t.val}</text>
        {/each}

        <!-- axes -->
        <line
          x1={graphMargin.left}
          y1={graphMargin.top}
          x2={graphMargin.left}
          y2={graphMargin.top + plotH}
          stroke="var(--axis-line)"
          stroke-width="1.5"
        />
        <line
          x1={graphMargin.left}
          y1={graphMargin.top + plotH}
          x2={graphWidth - graphMargin.right}
          y2={graphMargin.top + plotH}
          stroke="var(--axis-line)"
          stroke-width="1.5"
        />

        <!-- data line -->
        {#if timingPoints.length > 0}
          <polyline
            points={linePoints}
            fill="none"
            stroke="var(--graph-line)"
            stroke-width="2"
          />
          {#each timingPoints as p}
            <circle cx={xScale(p.n)} cy={yScale(p.dt)} r="3.5" fill="var(--graph-line)" />
          {/each}
        {/if}
      </svg>

      <p class="graph-caption">
        {#if timingPoints.length === 0}
          No correct guesses yet — solve a cell to start plotting.
        {:else}
          Point n shows the seconds elapsed between guess n−1 and guess n (point 1 is measured from game start).
        {/if}
      </p>
    </div>

    <!-- ---------- Density graph ---------- -->
    <div class="graph-section">
      <div class="graph-header">
        <h2>Distribution of response times</h2>
      </div>

      <svg width={densityWidth} height={densityHeight} class="timing-svg">
        <!-- horizontal gridlines + y ticks -->
        {#each densityYTicks as t}
          <line
            x1={densityMargin.left}
            y1={t.y}
            x2={densityWidth - densityMargin.right}
            y2={t.y}
            stroke="var(--grid-line)"
            stroke-width="1"
          />
        {/each}

        <!-- x ticks -->
        {#each densityXTicks as t}
          <line
            x1={t.x}
            y1={densityMargin.top + dPlotH}
            x2={t.x}
            y2={densityMargin.top + dPlotH + 5}
            stroke="var(--axis-line)"
            stroke-width="1"
          />
          <text
            x={t.x}
            y={densityMargin.top + dPlotH + 18}
            text-anchor="middle"
            class="axis-label"
          >{t.val.toFixed(1)}s</text>
        {/each}

        <!-- axes -->
        <line
          x1={densityMargin.left}
          y1={densityMargin.top}
          x2={densityMargin.left}
          y2={densityMargin.top + dPlotH}
          stroke="var(--axis-line)"
          stroke-width="1.5"
        />
        <line
          x1={densityMargin.left}
          y1={densityMargin.top + dPlotH}
          x2={densityWidth - densityMargin.right}
          y2={densityMargin.top + dPlotH}
          stroke="var(--axis-line)"
          stroke-width="1.5"
        />

        <!-- filled density curve -->
        {#if densityCurve.length > 0}
          <polygon
            points={densityAreaPoints}
            fill="var(--graph-line)"
            opacity="0.18"
          />
          <polyline
            points={densityLinePoints}
            fill="none"
            stroke="var(--graph-line)"
            stroke-width="2"
          />
          <!-- rug plot: one tick per actual sample, along the x-axis -->
          {#each rugTicks as rx}
            <line
              x1={rx}
              y1={densityMargin.top + dPlotH}
              x2={rx}
              y2={densityMargin.top + dPlotH - 6}
              stroke="var(--graph-line)"
              stroke-width="1.5"
              opacity="0.6"
            />
          {/each}
        {/if}
      </svg>

      <p class="graph-caption">
        {#if dtValues.length < 2}
          Need at least a couple of correct guesses to estimate a distribution.
        {:else}
          Smoothed estimate of how your response times are distributed (tick marks show individual guesses).
        {/if}
      </p>
    </div>
  </div>
</div>
