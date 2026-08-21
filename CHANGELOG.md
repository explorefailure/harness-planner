# Changelog

This project follows [Semantic Versioning](https://semver.org/) for public
releases.

Harness Planner is a single self-contained HTML file with no build step and no
dependencies, so a "release" is a tagged commit of `index.html`.

## Unreleased

Initial public source. No version has been tagged yet.

- Compare local AI hardware builds by what each can actually host, reported as
  worker counts rather than a score. There is no ranking and no best-fit badge.
- Model registry of 12 models across 8 families. Sizes are measured artifact
  bytes from the Hugging Face model-tree API; parameter counts are derived from
  the BF16 artifact rather than the model name.
- Detect natively quantised weights from a model's own `config.json` and refuse
  to apply a size formula to them, which would otherwise be wrong by up to 267%.
- Compute context reserve per model from its attention configuration, because
  measured per-model KV footprint spans a 26x range at identical context.
- Catalogue of 23 builds plus a 47-profile Mac configuration catalogue,
  classified into four memory topologies — pool, tiers, lanes, and nodes — so
  that a headline memory figure is never presented as usable memory.
- Model roster: assign different models to different jobs and pack them onto
  one machine together, respecting that machine's real topology.
- Derive an EPYC or GPU build from a payload and report the host constraints it
  implies.
- Repository invariants enforced by `tools/check.mjs` in CI.
