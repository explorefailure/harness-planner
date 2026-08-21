# Harness Planner

_An [Explore Failure](https://explorefailure.com/) field instrument._

[![CI](https://github.com/explorefailure/harness-planner/actions/workflows/ci.yml/badge.svg)](https://github.com/explorefailure/harness-planner/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

Plan a local LLM coding harness against real hardware: pick a model, see what
each machine can actually host, then assign different models to different jobs
and pack them onto one box together.

It is a single self-contained HTML file. No build step and no dependencies.
It loads no third-party assets; the only network access is reading public model
metadata from Hugging Face when you ask it to import a model, and everything
else works offline.

## The point

Most local-AI hardware advice compares a single headline memory number. That
number is almost never the number you can use:

| Machine | Says | Actually is |
|---|---|---|
| 4× RTX 3090 | 96 GB | four independent 24 GB lanes |
| DGX Station GB300 | 748 GB | 252 GB HBM3e + 496 GB LPDDR5X, 18× apart |
| Ryzen AI Max+ 395 | 128 GB | 96 GB dedicated VGM + 16 GB shared overflow |
| 2× DGX Spark | 224 GB | two machines on a link ~11× slower than local memory |

This tool models that difference instead of flattening it, and reports counts
rather than a score. There is no ranking, no "best fit" badge, and no number
that is not derived from memory arithmetic.

## Run it

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8765 --directory .
# http://127.0.0.1:8765/
```

## Import a model from Hugging Face

**Import model** takes a model page link or an `owner/name` id and reads that
repository's own figures, so a model that is not in the catalogue can still be
planned against. Nothing is downloaded but metadata — the weights are never
fetched, only their size is needed.

What it reads, and from where:

| Figure | Source |
|---|---|
| Parameter count | `safetensors.total` from the model's hub metadata |
| BF16 size | measured bytes of the canonical `model*.safetensors` set |
| Q4 / Q8 sizes | the matching GGUF artifacts in a quantised sibling repository |
| KV reserve inputs | `num_hidden_layers`, `num_key_value_heads`, `head_dim` from `config.json` |
| Native quantisation | `quantization_config.quant_method` in `config.json` |

Imported models carry `provenance: 'imported'` and are shown under an
**Imported** group with an `imported from the hub` flag. They are never
presented as `measured`, which is reserved for entries a human has verified.

Three cases where a figure is not simply measured, each stated in the UI:

- **No quantised sibling.** Q4 and Q8 fall back to `params × bits ÷ 8` and are
  flagged `estimated`. That formula runs low against real GGUF artifacts — on
  Qwen3-8B it is 18.5% under at Q4 and 6.0% under at Q8 — so treat those two
  numbers as a floor, not a measurement.
- **Natively quantised weights.** No size formula applies, so the measured
  artifact is reported at every precision, and the parameter figure counts
  packed tensor elements and will not match the model's name.
- **Gated repository.** The config cannot be read, so the KV reserve falls back
  to the generic estimate, exactly as for a gated catalogue entry. Hugging Face
  answers `401` both for a gated repository and for one that does not exist, so
  the error says both rather than guessing.

Two guards exist because the hub is messier than it looks. A repository that
ships a `consolidated.safetensors` beside its sharded set would otherwise be
counted twice, so only the canonical set is summed. And a GGUF repository often
carries speculative-decoding draft models naming the same precision — one is
0.85 GB where the real artifact is 63.39 GB — so a candidate far outside a
plausible fraction of the BF16 size is dropped rather than reported.

## Your plan persists

Every control — model, precision, context, roster, EPYC build, cluster and mix
composition, theme, imported models, and which view and Buy page you were on —
is saved to `localStorage` as you work and restored on the next visit.

**Copy plan link** encodes that same state into the URL, so a plan can be sent
somewhere or kept as a bookmark. Opening a plan link applies it and then strips
it from the address bar, so it cannot shadow later edits. A shared link always
wins over locally stored state.

Load `index.html#fresh` to discard the stored plan and start from defaults.

A stored plan is validated on restore: a model, machine, or profile that no
longer exists is dropped rather than applied, and a plan from an older schema
version is ignored outright.

## Files

- `index.html` — the entire instrument: markup, CSS, JavaScript, data.
- `tools/check.mjs` — repository invariants; run with `node tools/check.mjs`.
- `DESIGN.md` — visual direction and design decision record.
- `CONTRIBUTING.md` — how to add a model or machine without introducing an
  unsourced figure.
- `SECURITY.md` — trust boundary and private vulnerability reporting.
- `SUPPORT.md` — where to ask, and what this project will not do.
- `CHANGELOG.md` — release history.
- `NOTICE` — attribution, trademarks, and the accuracy statement.
- `LICENSE` — Apache License 2.0.

## How the numbers are derived

A worker's footprint is `weights + context reserve`.

**Weights** are measured artifact bytes from the Hugging Face model-tree API,
not estimates. A model's parameter count is derived from its BF16 artifact
(exactly 2 bytes/param) rather than taken from its name — the two disagree
whenever a model ships natively quantized.

**Context reserve** is computed per model from its own attention config:

```
KV bytes/token = 2 × layers × kv_heads × head_dim × 2
```

A single shared reserve table is not safe. Measured per-model reserve spans a
**26× range** at identical context, because KV footprint follows layers × KV
heads × head dim, not parameter count.

## The four memory topologies

`binsFor()` classifies each machine, and the difference between these is the
whole point:

- **Pool** — unified memory (Macs, a single DGX Spark). One allocation, summed.
- **Tiers** — one coherent address space at two speeds (DGX Station, Ryzen AI
  Max). A worker MAY straddle the boundary and simply runs slower, so tiers fit
  against total capacity and the spill is reported, not refused.
- **Lanes** — independent GPUs. A worker larger than one card needs explicit
  sharding, which is reported. NVLink-bridged pairs are still lanes, but the
  span crosses the bridge rather than PCIe.
- **Nodes** — separate machines on a network. Memory never pools, and the link
  is far slower than local memory.

Placement is first-fit-decreasing.

## Adding a model

Entries live in the `models[]` array. Two fields carry the traps:

- **`native`** — set when a model ships natively quantized (e.g. `mxfp4`,
  `fp8`). Such a model's weights barely change across precisions, so **no size
  formula applies** and only measured sizes are valid. This is detectable from
  the model's own `config.json` via `quantization_config`.
- **`arch`** — `{layers, kvHeads, headDim}` for the KV computation. `null`
  means the repo is gated and its config could not be read, in which case a
  generic estimate is used and the UI says so.

Get real sizes and a real config rather than estimating, and set `provenance`
honestly. **If a size cannot be sourced, leave the model out** — a plausible
wrong number is worse than a gap.

For reference, `params × bits ÷ 8` is exact at Q8 and BF16 across every model
tested, and within 7.8% at Q4 (the variance is MoE quantizers, not scale). It
fails by up to 267% on natively quantized weights, which is why the `native`
flag exists.

## Adding a machine

Entries live in the `setups[]` array. The fields that decide behaviour are
`shared`, `tiers`, `cluster`, `gpus`/`unit`, and `multiGpuLink`. Pick the one
that matches how the hardware actually holds memory — describing lanes as a
pool is the specific error this tool exists to avoid.

## Limitations

- Worker counts are **memory arithmetic, not benchmarks.** They say what fits,
  not how fast it runs. Backend choice, multimodal input, and preserved
  reasoning state all raise real use.
- Bandwidth is shown as context, never modelled as throughput.
- Hybrid-attention and sparse-attention models (Mamba layers, DSA) do not hold
  a conventional KV cache, so their computed reserve is an upper bound. These
  are flagged in the UI.
- Prices and specifications were accurate as read on the dates cited and may
  have changed.
- **An imported model is only as good as its repository.** The figures are read
  from the hub at import time and are not rechecked afterwards, so a plan can
  hold a size that has since changed. Imported entries are marked, and are not
  a substitute for the catalogue's verified numbers.
- **A plan link can outgrow a paste.** The link carries the whole state as
  uncompressed JSON with long keys, so it grows with the roster and mix rows:
  a four-role roster across all six topologies encodes to about 1,880
  characters. Because shapes seed their roster from one another, each distinct
  roster is stored once and the shapes point at it, so visiting every shape
  costs almost nothing — only rosters you actually edit apart add length, and
  three genuinely different rosters reach roughly 3,400. Each imported model
  travels in the link too, so that the recipient sees the same numbers without
  refetching, and costs about 780 characters. Browsers and bookmarks handle
  that comfortably, but some chat clients truncate URLs near 2,000, so a large
  plan could produce a link that does not arrive intact. Shortening the state
  keys, or omitting values that already match the defaults, would cut it
  substantially — neither is done yet.

## Branding

This is an Explore Failure field instrument. It reuses the EF palette roles
(signal cyan, progress yellow, failure coral, field green for verified
evidence), the classification strip, the specimen label, and the claim-state
vocabulary, per the Reuse clause in the EF site's design record.

**Known deviation:** the EF public identity is deliberately light-only. This
instrument keeps its dark instrument-panel default with a light toggle, by
owner decision.

## License

Copyright 2026 Garrett Davis. Apache License 2.0 — see [LICENSE](LICENSE)
and [NOTICE](NOTICE).

"Explore Failure" is a research and project identity, not a legal entity.

Third-party hardware and model names are trademarks of their respective
owners and are used only to identify what is being planned for. Explore
Failure is not affiliated with, endorsed by, or sponsored by any of them.
