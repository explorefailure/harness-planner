# Harness Planner — design record

Direction: Swiss × instrument-panel blue-grey × dense × quiet
Why this subject: A hardware-and-model routing tool should feel like a legible engineering console, with firm hierarchy and measured status signals rather than decorative spectacle.
Palette: Ink `#13212a`; paper `#edf1f2`; panel `#dfe6e8`; cyan signal `#087f8c`; amber caution `#c77a15`; red limit `#b94b42`.
Type: System grotesk display / system sans body / monospace utility; compact modular scale.
Signature: Horizontal “signal lanes” that show model workers or inference phases assigned to physical hardware; the EPYC builder uses the same instrument cells to turn a GPU payload into a constrained host specification.
Reuse: The Buy, Deploy, Cluster, Mix, and Phase split views share the same control-strip, metric-cell, and signal-lane language; cluster views and the EPYC/GPU Build Designer extend the system into node topologies and reference-platform constraints without changing the visual direction.
