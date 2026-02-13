# MicroGPT Explainer — Redesign Plan

## Philosophy
**Top-down, curiosity-first.** Every concept is motivated by a question the learner already has. Not "here's backprop" but "how does the model figure out which numbers to fix?"

---

## Teaching Flow (7 beats)

### 1. The Magic Trick
Show a trained model generating names (or whatever dataset they picked). No explanation. Just: "This learned to do this from scratch. How?"

### 2. Prediction Is the Game
"At its core, it just predicts the next character." Show a half-typed input, show probabilities. Let them guess before the model does.

### 3. Why Prediction Needs Memory
"To predict the next letter of 'elizab...', you need to remember what came before." This motivates attention — not as math, but as "looking back."

### 4. Numbers All the Way Down
"Each character is a list of 16 numbers." Let them drag sliders, see how changing a number changes the model's prediction. Embeddings become tangible.

### 5. The Learning Loop (Live)
Train in real-time in the browser. But show GENERATED OUTPUT evolving, not just loss numbers.
- Step 1: "xqzmvr"
- Step 20: "eliab"  
- Step 50: "sophia"

This is the aha moment.

### 6. Backprop as Blame
"When the model guesses wrong, which numbers were responsible?" Visualize one wrong prediction tracing backward. "This weight made the mistake worse → turn it down."

### 7. The Full 243 Lines
"Everything you just learned lives in here." Reveal the code, annotated.

---

## Dataset Ideas

The default is baby names, but the real magic is letting users pick. When it generates something that sounds like *their* data, it clicks.

### 🔥 Tier 1 — High joy, visually/aurally delightful

| Dataset | What it generates | Why it's fun |
|---------|-------------------|--------------|
| **Emoji sequences** | New "emoji stories" | Visual, shareable, universal |
| **Music melodies** | Note sequences → play with Web Audio | *Hearing* your model compose is magical |
| **Pokémon names** | "Charveon", "Pikadra" | People immediately want to share these |

### ✨ Tier 2 — Personal, high engagement

| Dataset | What it generates | Why it's fun |
|---------|-------------------|--------------|
| **Color palettes** | Hex color sequences → render swatches | Instant visual output |
| **Your own text** | User pastes any corpus | "Wait, it learned MY thing?" |
| **Culture-specific names** | Names from different traditions | Makes it personal across cultures |

### 📚 Tier 3 — Educational, good for understanding

| Dataset | What it generates | Why it's fun |
|---------|-------------------|--------------|
| **English words** | Plausible fake words | Shows pattern learning clearly |
| **Chemical formulas** | Fake but plausible-looking molecules | Science nerds love this |
| **Baby names (default)** | The Karpathy classic | Proven, well-understood baseline |

---

## Dataset Requirements
For microgpt (character-level, block_size=8, small vocab):
- Short sequences (ideally 3-15 chars each)
- Small vocabulary (< 50 unique characters ideal, < 100 workable)
- Enough examples (50+ for variety, 500+ for real learning)
- Clear patterns for the model to find

---

## Data Research — DONE

### 🎵 Music (Nottingham Music Database) — VALIDATED ✅
- **Source**: https://abc.sourceforge.net/NMD/ — 1000+ folk tunes in ABC notation
- **Cleaned**: 538 tunes (jigs, reels, hornpipes, waltzes), 39-char vocab
- **Lengths**: 70-1100 chars per tune (mean 206)
- **Vocab**: ` '()+,-/123468:=ABCDEFGH[\]^_abcdefgz|~`
- **Training results**:
  - block_size=8, 100 steps: loss 3.7→2.3, generates valid jingle-length fragments
  - block_size=32, 100 steps: running (slower, ~15s/step native)
- **Audio playback**: ABC→Web Audio parser built and tested. Triangle wave, attack/decay envelope.
- **Two modes planned**: Jingle (block_size=8, ~30s Pyodide) and Melody (block_size=32, ~2-4 min)

### Other datasets (future)
- Pokémon names, color palettes, emoji sequences — see original ideas above

---

## Implementation Approach

1. **Document this plan** ✅ (this file)
2. **Research and collect datasets** — find or generate for top picks
3. **Dataset picker UI** — dropdown or cards to select dataset
4. **Adapt training code** — character mapping layer for non-ASCII (emoji)
5. **Rich output renderers** — emoji display, color swatches, audio playback
6. **Evolving output during training** — show generation quality improving per step
7. **Rebuild explainer flow** — top-down structure per the 7 beats above

---

## Open Questions
- How much do we want to change the existing explainer vs build a v2?
- Should datasets be bundled or fetched from a CDN?
- Do we want a "gallery" of other people's trained models?
- Mobile performance ceiling — can we train on phone? (Pyodide might be heavy)

---

*Last updated: 2026-02-13*
