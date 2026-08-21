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
- Harness topology as a parameter of one Deploy surface rather than separate
  Cluster, Mix, and Phase split tabs. Six shapes — single node, independent
  replicas, workers + judge, distributed single model, federated islands, and
  a prefill/decode phase split — each with an inline-SVG diagram, its
  claim state, and its live worker count for the current model, precision and
  context. The start gate offers topology as a fourth way in: that door opens a
  second gate step showing only the six shapes, with its own precision and
  context so the counts are yours before you pick one.
- Precision and context have one owner, so they follow you across every shape
  and the Buy view instead of being re-answered per view.
- Each shape keeps its own roster, seeded from the shape you arrived from.
  Shapes with no roles to assign — a distributed single model and a phase
  split — say so rather than rendering a roster that does not apply.
- Repository invariants enforced by `tools/check.mjs` in CI.
