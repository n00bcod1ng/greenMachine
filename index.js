#!/usr/bin/env node
import jsonfile from "jsonfile";
import simpleGit from "simple-git";
import readline from "readline";
import moment from "moment";
import { buildGrid, previewGrid, gridToDates, gridWidth } from "./pattern.js";

const DATA_PATH = "./data.json";
const git = simpleGit();

// ─── ARG PARSING ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {
    word: null,
    year: new Date().getFullYear(),
    intensity: 4,
    start: null, // auto-center if null
    clear: false,
    yes: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--word":
      case "-w":
        args.word = argv[++i];
        break;
      case "--year":
      case "-y":
        args.year = parseInt(argv[++i], 10);
        break;
      case "--intensity":
      case "-i":
        args.intensity = parseInt(argv[++i], 10);
        break;
      case "--start":
      case "-s":
        args.start = parseInt(argv[++i], 10);
        break;
      case "--clear":
        args.clear = true;
        args.year = parseInt(argv[++i], 10);
        break;
      case "--yes":
        args.yes = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }
  return args;
}

function printHelp() {
  console.log(`
greenMachine — paint text & art onto your GitHub contribution graph

USAGE
  node index.js --word "HELLO" [options]
  node index.js --clear 2025

OPTIONS
  -w, --word <text>       Text to render (A-Z, 0-9, space, !, plus <3 and :) )
  -y, --year <year>       Target year (default: current year)
  -i, --intensity <1-5>   Commits per pixel — higher = darker green (default: 4)
  -s, --start <week>      Starting week column. Omit to auto-center.
      --clear <year>       Wipe ALL commit history (clean slate for a year)
      --yes                Skip the confirmation prompt
  -h, --help               Show this help

EXAMPLES
  node index.js --word "HACK" --year 2025 --intensity 4
  node index.js --word ":)" --year 2026
  node index.js --word "<3" --year 2026 --start 20
  node index.js --clear 2025
`);
}

// ─── CONFIRM PROMPT ───────────────────────────────────────────────────────────
function confirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase().startsWith("y"));
    });
  });
}

// ─── CLEAR HISTORY ────────────────────────────────────────────────────────────
async function clearHistory() {
  console.log("\n⚠️  This will permanently wipe ALL commit history in this repo.");
  const ok = await confirm("Are you sure? (y/n) ");
  if (!ok) {
    console.log("Aborted.");
    return;
  }
  try {
    await git.checkout(["--orphan", "temp_clean"]);
    await jsonfile.writeFile(DATA_PATH, { reset: true });
    await git.add(["-A"]);
    await git.commit("fresh start");
    await git.deleteLocalBranch("main", true).catch(() => {});
    await git.branch(["-m", "main"]);
    await git.push(["origin", "main", "--force"]);
    console.log("✅ History wiped. The graph will clear in a few minutes.");
  } catch (err) {
    console.error("Error during wipe:", err.message);
  }
}

// ─── MAKE COMMITS ─────────────────────────────────────────────────────────────
function makeCommits(dates) {
  return new Promise((resolve, reject) => {
    let index = 0;
    const total = dates.length;

    const step = () => {
      if (index >= total) {
        console.log(`\nPushing ${total} commits...`);
        git.push().then(resolve).catch(reject);
        return;
      }
      const date = dates[index];
      const data = { date, index };

      if (index % 20 === 0) {
        const pct = Math.round((index / total) * 100);
        process.stdout.write(`\rProgress: ${index}/${total} (${pct}%)   `);
      }

      jsonfile.writeFile(DATA_PATH, data, () => {
        git
          .add([DATA_PATH])
          .commit(`paint ${index}`, { "--date": date }, () => {
            index++;
            step();
          });
      });
    };
    step();
  });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);

  if (args.clear) {
    await clearHistory();
    return;
  }

  if (!args.word) {
    console.error("Error: no --word provided. Run with --help for usage.");
    process.exit(1);
  }

  if (args.intensity < 1 || args.intensity > 5) {
    console.error("Error: --intensity must be between 1 and 5.");
    process.exit(1);
  }

  const grid = buildGrid(args.word);
  const width = gridWidth(grid);

  // Auto-center if no explicit start week given. Graph is ~52 weeks wide.
  const GRAPH_WEEKS = 52;
  let startCol = args.start;
  if (startCol === null) {
    startCol = Math.max(0, Math.floor((GRAPH_WEEKS - width) / 2));
  }

  if (startCol + width > GRAPH_WEEKS) {
    console.warn(
      `⚠️  Warning: "${args.word}" is ${width} weeks wide and may overflow the graph.`
    );
  }

  // Preview
  console.log(`\n  Word:       "${args.word}"`);
  console.log(`  Year:       ${args.year}`);
  console.log(`  Intensity:  ${args.intensity} commits/pixel`);
  console.log(`  Width:      ${width} weeks  (starts at week ${startCol})\n`);
  console.log(previewGrid(grid));

  const dates = gridToDates(grid, args.year, startCol, args.intensity);
  console.log(`\n  Total commits to create: ${dates.length}\n`);

  if (!args.yes) {
    const ok = await confirm("Proceed and write these commits? (y/n) ");
    if (!ok) {
      console.log("Aborted. Nothing was committed.");
      return;
    }
  }

  // Shuffle so commits don't push in pixel order
  dates.sort(() => Math.random() - 0.5);

  try {
    await makeCommits(dates);
    console.log(
      `\n✅ Done! Check your profile for ${args.year}. The graph may take a few minutes to update.`
    );
    console.log(
      "   Tip: if it doesn't show, toggle 'Private contributions' in your profile settings."
    );
  } catch (err) {
    console.error("\nError while committing:", err.message);
  }
}

main();
