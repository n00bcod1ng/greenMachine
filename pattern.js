import { FONT } from "./font.js";
import moment from "moment";

// Tokenize an input string into glyph keys.
// Supports multi-char tokens like "<3" and ":)".
function tokenize(text) {
  const tokens = [];
  let i = 0;
  const upper = text.toUpperCase();

  while (i < upper.length) {
    const two = text.slice(i, i + 2); // keep original case for symbols
    if (FONT[two]) {
      tokens.push(two);
      i += 2;
      continue;
    }
    const one = upper[i];
    if (FONT[one]) {
      tokens.push(one);
    } else {
      // Unknown char -> render as a space
      tokens.push(" ");
    }
    i += 1;
  }
  return tokens;
}

// Build a combined 7-row grid for the whole string, with 1-col gaps between glyphs.
export function buildGrid(text) {
  const tokens = tokenize(text);
  const rows = [[], [], [], [], [], [], []];

  tokens.forEach((token, index) => {
    const glyph = FONT[token];
    const width = glyph[0].length;

    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < width; c++) {
        rows[r].push(glyph[r][c]);
      }
      // gap column after every glyph except the last
      if (index < tokens.length - 1) rows[r].push(0);
    }
  });

  return rows;
}

// Render the grid to the terminal so the user can confirm before committing.
export function previewGrid(grid, { filled = "■", empty = "·" } = {}) {
  const lines = grid.map((row) =>
    row.map((cell) => (cell ? filled : empty)).join(" ")
  );
  return lines.join("\n");
}

// Convert a grid into commit dates for a given year.
// startCol = how many weeks from the left edge to begin.
// The contribution graph's first cell is the Sunday on/just before Jan 1.
export function gridToDates(grid, year, startCol, commitsPerPixel) {
  // First Sunday of the contribution graph for this year:
  // GitHub shows the week containing Jan 1, starting on the prior Sunday.
  const jan1 = moment(`${year}-01-01`);
  const graphStart = jan1.clone().startOf("week"); // moment's week starts on Sunday by default

  const dates = [];
  const width = grid[0].length;

  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < width; col++) {
      if (grid[row][col] === 1) {
        const date = graphStart
          .clone()
          .add(startCol + col, "weeks")
          .add(row, "days")
          .hour(12)
          .minute(0)
          .second(0)
          .format();

        for (let n = 0; n < commitsPerPixel; n++) {
          dates.push(date);
        }
      }
    }
  }
  return dates;
}

export function gridWidth(grid) {
  return grid[0].length;
}
