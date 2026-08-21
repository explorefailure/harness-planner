# Harness Planner

_An [Explore Failure](https://explorefailure.com/) field instrument._

Plan a local LLM coding harness against real hardware: pick a model, see what
each machine can actually host, then assign different models to different jobs
and pack them onto one box together.

It is a single self-contained HTML file. No build step, no dependencies, no
network requests.

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

## Files

- `index.html` — the entire instrument: markup, CSS, JavaScript, data.
- `DESIGN.md` — visual direction and design decision record.
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
