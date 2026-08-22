# Changelog

This project follows [Semantic Versioning](https://semver.org/) for public
releases.

Architecture Playground is a single self-contained HTML file with no build step and no
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
- Derive a host from a GPU payload and report the constraints it implies, in
  two separate designers: Consumer PC builds (AM5 / X870E and LGA1851 / Z890)
  and Server hardware (SP3, SP5, and the dual-SP5 eight-GPU platform). Each
  panel lists only its own platforms and only the GPU counts its boards can
  host, so a consumer desktop is never answered with a 4U chassis — which is
  what a single RTX 3090 used to derive, the most expensive wrong answer the
  builder could give. Consumer hosts state what they cost you: sixteen graphics
  lanes split x8/x8 across two cards, two memory channels against eight or more,
  and no ECC on Z890. Both designers share one derivation engine and one saved
  build; whichever panel you save from owns it, and the other panel's button
  says so.
- GPU catalogue of 18 cards spanning consumer, workstation, and data-center
  boards across three software stacks: RTX 5070 Ti, RTX 5080, RTX 3090, RTX 4090,
  RTX 5090, RTX A5000, RTX A6000, RTX 6000 Ada, A40, L40S, A100 80GB PCIe, both
  RTX PRO 6000 Blackwell editions, Radeon RX 7900 XTX, Radeon AI PRO R9700,
  Radeon PRO W7900, Intel Arc Pro B60, and the aftermarket 48GB RTX 4090.
- Each card now carries its memory bandwidth, its cooling design, and whether
  it has an NVLink bridge, because at eleven cards these are what separate two
  boards of identical capacity. Bandwidth spans 696GB/s to 1,935GB/s across the
  catalogue, so two 48GB cards are no longer indistinguishable in the panel.
- Cooling mismatches are flagged, never blocked. A passively cooled server board
  in a desktop tower is a real build that needs a shroud and ducted fans, so the
  panel says to devise that cooling rather than refusing the configuration; an
  actively cooled card in a 4U chassis raises the opposite warning. One card
  property read in two directions, replacing per-card special cases.
- The bridge is described honestly at every count. Two bridgeable cards are
  reported as bridgeable; four or eight are told plainly that a two-way bridge
  does not make them one pool, which is the assumption most likely to cost
  money. Cards with no NVLink say so rather than staying silent.
- Where a GPU count is refused, the panel names which ceiling it hit — the
  host's or the card's — because a host limit is answered by a different chassis
  and a card limit by a different card.
- Worker capacity is now computed against the model actually selected instead of
  a flat 20GB constant. The old proxy floored to a minimum of one, so a 16GB card
  would have reported a working worker for a model it cannot hold. A card that
  does not fit reports zero and names what would change it — lower precision,
  less context, or more memory — while remaining a saveable build, because the
  hardware is real and the model is a separate control.
- The software stack is a first-class field. CUDA, ROCm, and oneAPI builds each
  carry their own backend through to the cluster recipe, and the non-CUDA cards
  state their setup friction once, plainly, without being treated as incapable.
- Aftermarket cards are listed with their provenance attached rather than
  omitted. The 48GB RTX 4090 says that NVIDIA specifies no such configuration,
  that its figures are reported rather than published, and that warranty, driver
  support, and resale are the buyer's risk.
- Cards that are electrically narrower than their slot report the narrower width.
  The Arc Pro B60 wires eight lanes in a sixteen-lane slot, and the planner no
  longer also warns it about a lane split that costs it nothing.
- A repository invariant rejects an unknown software stack, a missing lane count,
  and any card claiming a vendor-published bandwidth while declaring that no
  vendor sells it.
- Every bandwidth in the catalogue is a vendor-published figure, sourced from
  each card's datasheet or, for the GeForce boards NVIDIA omits it from, that
  generation's architecture whitepaper. Nothing is computed by the planner. The
  panel still carries a provenance field and will label a derived figure as
  derived if a future card has no published number.
- A repository invariant rejects any GPU profile missing a required field, or
  declaring a cooling design that is neither active nor passive.
- System memory is a costed parameter of both host designers rather than a
  label. Each capacity states the module plan that reaches it — filling every
  slot, which is one DIMM per channel on the server boards and two on the
  consumer boards — and the memory's own draw enters the power estimate, so a
  fully populated 3TB server no longer derives the same PSU target as a 768GB
  one. A build whose system memory falls below its total VRAM is flagged. A
  repository invariant rejects any capacity that cannot be reached with modules
  that are actually manufactured.
- Harness topology as a parameter of one Deploy surface rather than separate
  Cluster, Mix, and Phase split tabs. Six shapes — single node, independent
  replicas, workers + judge, distributed single model, federated islands, and
  a prefill/decode phase split — each with an inline-SVG diagram, its
  claim state, and its live worker count for the current model, precision and
  context. The start gate offers topology as one of its three ways in: that door
  opens a second gate step showing only the six shapes. It asks nothing else —
  the counts use the model, precision and context already in hand, and the note
  under the grid says which those were.
- Precision and context have one owner, so they follow you across every shape
  and the Buy view instead of being re-answered per view.
- Each shape keeps its own roster, seeded from the shape you arrived from.
  Shapes with no roles to assign — a distributed single model and a phase
  split — say so rather than rendering a roster that does not apply.
- Buy is two pages: a machine page (exact Mac configuration, a standalone
  system bought whole, or a host derived from a GPU payload) and a browse
  page (the pre-designed builds, each reporting its own worker counts). The
  gate's machine and browse doors open the matching page, and a switch above
  the shared precision and context strip moves between them, so neither door
  hides the other page. The chosen page is saved with the rest of the plan and
  travels in a plan link.
- Import a model from Hugging Face by pasting its page link or `owner/name`.
  The planner reads the repository's parameter count, canonical weight-file
  sizes, quantised sibling artifacts, and attention config, then computes from
  those. Weights are never downloaded. Imported entries carry
  `provenance: 'imported'`, sit in their own group, and state per precision
  whether a size was measured, native, or estimated.
- The import control carries the Hugging Face logo, so what it connects to is
  legible before the label is read. The logo is that company's own published
  asset, inlined as vector paths rather than linked, so it costs no request and
  the page stays self-contained.
- The import panel opens over the start gate rather than being hidden by it, so
  a model can be imported before a route is chosen and the gate's topology
  counts describe that model.
- The page now reaches one network origin, `https://huggingface.co`, and only
  when a model is imported. The origin is declared once, every request is built
  from that constant, and no other network transport is allowed; a new
  `tools/check.mjs` invariant proves this and fails CI otherwise. The trust
  boundary in `SECURITY.md` was rewritten to match, including a standing claim
  that the page stored nothing, which `localStorage` persistence had already
  made untrue.
- Standalone systems have their own panel on the machine page: DGX Spark, a
  cabled Spark pair, DGX Station GB300, Jetson AGX Thor, and Ryzen AI Max+ 395.
  These are systems bought whole, so neither the Mac catalogue nor the payload-
  derived host designer fits them. The panel holds no figures of its own —
  it selects among catalogue entries and reports each system's memory-topology
  note instead of a headline number, because two of the five are tiered and one
  is two machines rather than one pool.
- Repository invariants enforced by `tools/check.mjs` in CI.
