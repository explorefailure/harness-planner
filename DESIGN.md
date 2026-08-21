# Harness Planner — design record

Direction: Swiss × instrument-panel blue-grey × dense × quiet
Why this subject: A hardware-and-model routing tool should feel like a legible engineering console, with firm hierarchy and measured status signals rather than decorative spectacle.
Palette: Ink `#13212a`; paper `#edf1f2`; panel `#dfe6e8`; cyan signal `#087f8c`; amber caution `#c77a15`; red limit `#b94b42`.
Type: System grotesk display / system sans body / monospace utility; compact modular scale.
Signature: Horizontal “signal lanes” that show model workers or inference phases assigned to physical hardware; the EPYC builder uses the same instrument cells to turn a GPU payload into a constrained host specification.
Reuse: The Buy and Deploy views share the same control-strip, metric-cell, and signal-lane language; the harness topology cards and the EPYC/GPU Build Designer extend the system into node topologies and reference-platform constraints without changing the visual direction.
Topology: Harness arrangement is a parameter of the one Deploy surface, not a set of sibling tabs. Each of the six shapes carries an inline-SVG diagram drawn on theme tokens, its claim-state pill, and its live worker count. The counts are what make the cards informative whether or not you choose from them; the claim pills are evidence states, never a ranking.
Two presentations, one grid: mid-session the shapes are tiny at rest — a single line naming the current one — opening into a card page that keeps the topbar and tabs, titled a place ("Harness topology") because it is somewhere you already are. Reached from the start gate's topology door it is the gate's second step: full-screen with the rest of the app hidden, titled a question, carrying its own precision and context so the counts are yours before you commit to a shape. The rule the two share is that the page must never be a toll booth — it is a gate only for someone who asked for one, and every card reports real arithmetic either way.
