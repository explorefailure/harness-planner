# Contributing to Harness Planner

Thank you for considering a contribution. This project is solo-maintained, so
please open an issue before starting substantial work — it avoids you building
something that will be declined for reasons that have nothing to do with the
quality of the work.

## The one rule that matters

**Every number the planner displays must trace back to a primary source.**

A primary source is a vendor specification page, an official model card, or a
model-tree API response. An article, benchmark round-up, or forum post that
restates a vendor claim is not a primary source — cite the thing it restates.

If a figure cannot be sourced, **leave it out**. A gap is honest; a
plausible-looking value that nobody can check is the failure mode this whole
project is built against. A model with no published artifact size does not
enter the registry, and a machine with an unverifiable memory figure does not
enter the catalogue.

Where two credible sources disagree, that is usually a signal that they are
measuring different things and both may be right. The Ryzen AI Max+ 395 is the
worked example: 96 GB and 112 GB are both correct, for dedicated versus total
addressable graphics memory. Model both rather than picking one.

## Setup

There isn't any. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8765 --directory .
```

No build step, no package manager, no dependencies. Node is needed only to run
the checks.

## Before you open a pull request

```sh
node tools/check.mjs
```

This enforces the repository invariants and fails the build if any break:

- the inline JavaScript parses
- the page is self-contained — no off-host script, link, or image references
- the Apache 2.0 header and copyright line are present
- no local filesystem paths or personal addresses have crept in
- every model declares a provenance and complete sizes, and a natively
  quantised model is never marked as formula-sized
- every build declares how it actually holds memory

Also open the page and exercise the tabs your change touches. The planner is
stateless, so a model, machine, precision, and context is a complete
reproduction of any behaviour.

## Adding a model

Entries live in the `models[]` array. Beyond name and sizes, two fields carry
the traps:

- **`native`** — set it when a model ships natively quantised, such as MXFP4 or
  FP8. Those weights barely change across precisions, so no size formula
  applies and only measured sizes are valid. You can detect this from the
  model's own `config.json` via `quantization_config`, and confirm it
  independently: if the BF16 artifact divided by two disagrees with the
  published parameter count, the model does not ship true BF16.
- **`arch`** — `{layers, kvHeads, headDim}`, used to compute that model's
  context reserve. Use `null` if the repository is gated and its config cannot
  be read; the planner then falls back to a generic estimate and says so on
  screen.

Set `provenance` honestly: `measured` only if you actually read the artifact
sizes.

`imported` is reserved for entries the running page read from Hugging Face at a
user's request. Do not commit an entry with that provenance: a catalogue entry
is a human claim about a model, and the whole point of the distinction is that
`measured` means someone checked. If the importer's numbers look right, verify
them yourself and commit them as `measured`.

## Adding a machine

Entries live in the `setups[]` array. The important decision is not the
specification, it is **which of the four memory topologies the machine really
is**:

- **Pool** — one unified allocation.
- **Tiers** — one coherent address space at two speeds. A worker may straddle
  the boundary and simply runs slower.
- **Lanes** — independent GPUs. A worker larger than one card needs explicit
  sharding.
- **Nodes** — separate machines on a network. Memory never pools.

Describing lanes as a pool is the specific error this project exists to avoid.
If you are unsure which a machine is, say so in the pull request rather than
guessing.

## Style

Match the surrounding code. It is plain ES modules-free browser JavaScript with
no framework, no build step, and no transpilation; keep it that way. Prefer a
computed value over a hand-entered one wherever a computation is available.

Design changes should be consistent with `DESIGN.md`, which is the visual
decision record.

## What will be declined

- Any figure without a primary source.
- A ranking, a score, or a "best" recommendation. The planner reports what
  fits and where the numbers came from; the choice belongs to the reader.
- Dependencies, build steps, or external asset loads.
- Telemetry or analytics of any kind.

## Licence

By contributing, you agree that your contributions are licensed under the
Apache License 2.0, as set out in [LICENSE](LICENSE) and [NOTICE](NOTICE).
