# 🟩 greenMachine

> A CLI tool to paint text and pixel art onto your GitHub contribution graph — with a live terminal preview so you see exactly what you'll get *before* a single commit is made.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat&logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat)

---

## 📌 Description

**greenMachine** turns your GitHub contribution graph into a canvas. Pass it any word and it renders that text as pixel art onto the graph by generating backdated Git commits — one (or more) per "lit" pixel.

The standout feature: it **previews the pattern in your terminal and asks for confirmation before committing anything.** No more pushing hundreds of commits only to discover the letters are misaligned.

```
  Word:       "HACK"
  Year:       2025
  Intensity:  4 commits/pixel
  Width:      23 weeks  (starts at week 1)

■ · · · ■ · · ■ ■ ■ · · · ■ ■ ■ · · ■ · · · ■
■ · · · ■ · ■ · · · ■ · ■ · · · ■ · ■ · · ■ ·
■ · · · ■ · ■ · · · ■ · ■ · · · · · ■ · ■ · ·
■ ■ ■ ■ ■ · ■ ■ ■ ■ ■ · ■ · · · · · ■ ■ · · ·
■ · · · ■ · ■ · · · ■ · ■ · · · · · ■ · ■ · ·
■ · · · ■ · ■ · · · ■ · ■ · · · ■ · ■ · · ■ ·
■ · · · ■ · ■ · · · ■ · · ■ ■ ■ · · ■ · · · ■

  Total commits to create: 248

Proceed and write these commits? (y/n)
```

---

## 🛠 Tech Stack

| Tool | Purpose |
|------|---------|
| [Node.js](https://nodejs.org) | Runtime (ES modules) |
| [simple-git](https://github.com/steveukx/git-js) | Programmatic Git commits & pushes |
| [moment.js](https://momentjs.com) | Date calculation and contribution-graph alignment |
| [jsonfile](https://github.com/jprichardson/node-jsonfile) | Writing the commit payload to disk |
| `readline` (built-in) | Interactive confirmation prompt |

---

## ✨ Key Features

- ⌨️ **Full CLI** — control everything with flags: `--word`, `--year`, `--intensity`, `--start`
- 👁️ **Live terminal preview** — see the exact pattern and commit count *before* anything is written
- 🔤 **Complete font** — full A–Z, 0–9, space, `!`, plus special glyphs `<3` (heart) and `:)` (smiley)
- 🎯 **Auto-centering** — patterns are automatically centered on the graph unless you specify a start week
- 🎛️ **Intensity control** — 1–5 commits per pixel to control the shade of green
- 🧹 **Built-in wipe command** — `--clear <year>` resets the repo to a clean slate, no manual git surgery
- 🔀 **Shuffled commits** — commits are randomized before pushing so history isn't written in pixel order

---

## 🧠 How I Built It

A GitHub contribution graph is a **7-row × ~52-column grid**: 7 rows for the days of the week (Sunday at top), 52 columns for the weeks of the year. Each cell's shade is driven by how many commits share that date.

The build broke down into four parts:

1. **A pixel font** (`font.js`) — every character is hand-defined as a 7-row binary matrix. Letters are 5 cells wide, some glyphs (like `I`) are narrower, and the emoji-style glyphs are 11 wide.
2. **A layout engine** (`pattern.js`) — tokenizes the input string (handling multi-character glyphs like `<3`), stitches the glyphs together with 1-column gaps, and produces a single combined grid.
3. **Date mapping** — the trickiest part. Each lit pixel at `(row, col)` maps to a real calendar date: `graphStart + (col × 7 days) + row days`, where `graphStart` is the Sunday that begins the target year's graph. Using explicit day offsets from a known Sunday — rather than moment's `.day()` snapping — is what makes the alignment pixel-perfect.
4. **The CLI** (`index.js`) — argument parsing, the preview/confirm flow, recursive async commits, and the history-wipe command.

It draws inspiration from [fenrir2608/goGreen](https://github.com/fenrir2608/goGreen) (the original backdated-commit concept) and [mattrltrent/github_painter](https://github.com/mattrltrent/github_painter) (the idea of painting deliberate designs), but reworks both into a single text-driven CLI with a safety-first preview step.

---

## 📚 Lessons Learned

- GitHub counts contributions by a commit's **author date**, not its push date — which is the entire mechanism that makes this possible.
- `moment().day(n)` snaps to the *nearest* matching weekday and silently shifts pixels by a week. Switching to `.add(n, "days")` from a fixed Sunday anchor fixed alignment bugs that were impossible to spot until commits were already pushed — which is exactly why the **preview step earns its keep.**
- Each commit has to fully complete before the next begins, otherwise Git throws `index.lock` errors. Recursive async callbacks enforce that ordering.
- ES modules (`"type": "module"`) are required for `import` syntax in Node.

---

## 🚀 How to Run Locally

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- A **new, empty repository** dedicated to this (don't use a real project — this rewrites history)
- Git configured with the email tied to your GitHub account:
  ```bash
  git config user.email "your-github-email@example.com"
  git config user.name "Your Name"
  ```

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/greenMachine.git
cd greenMachine
npm install
```

### Usage

```bash
# Paint "HACK" across 2025
node index.js --word "HACK" --year 2025 --intensity 4

# Drop a smiley face on 2026 (auto-centered)
node index.js --word ":)" --year 2026

# Place a heart at a specific starting week
node index.js --word "<3" --year 2026 --start 20

# Wipe everything and start fresh
node index.js --clear 2025
```

### Options

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--word` | `-w` | Text to render (A–Z, 0–9, space, `!`, `<3`, `:)`) | — |
| `--year` | `-y` | Target year | current year |
| `--intensity` | `-i` | Commits per pixel (1–5), controls green shade | `4` |
| `--start` | `-s` | Starting week column; omit to auto-center | auto |
| `--clear` | | Wipe all commit history for a clean slate | — |
| `--yes` | | Skip the confirmation prompt | off |
| `--help` | `-h` | Show usage | — |

---

## 🖼 Demo

`node index.js --word ":)" --year 2026`

```
· · ■ ■ ■ ■ ■ ■ ■ · ·
· ■ · · · · · · · ■ ·
■ · · ■ · · · ■ · · ■
■ · · · · · · · · · ■
■ · ■ · · · · · ■ · ■
· ■ · ■ ■ ■ ■ ■ · ■ ·
· · ■ ■ ■ ■ ■ ■ ■ · ·
```

> ⚠️ **Note:** GitHub may take a few minutes to update the graph after pushing. If it doesn't appear, toggle **Private contributions** in your profile settings to force a re-sync.

---

## 🙏 Credits

- [fenrir2608/goGreen](https://github.com/fenrir2608/goGreen) — original backdated-commit concept
- [mattrltrent/github_painter](https://github.com/mattrltrent/github_painter) — inspiration for deliberate graph designs

---

## ⚠️ Disclaimer

This is a fun project for learning how Git author dates and the contribution graph work. Use it on a throwaway repo and at your own discretion — misrepresenting activity on a graph employers review is your call to make.

## 📄 License

MIT — do whatever you want with it.
