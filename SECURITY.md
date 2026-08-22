# Security policy

## Supported versions

No Architecture Playground version has been published yet. Untagged commits and
development branches do not receive security support.

After the first public release, only the newest published release will receive
security fixes. A fixed release supersedes older releases; this table will be
updated if the project adopts a longer support window.

| Version | Supported |
|---|---|
| newest published release | yes |
| older releases | no |
| untagged development snapshots | no |

## Reporting a vulnerability

Report vulnerabilities through GitHub's private vulnerability-reporting form:

<https://github.com/explorefailure/architecture-playground/security/advisories/new>

If that link does not present a private report form, **do not post exploit
details or proof-of-concept code in a public issue**. There is currently no
published security email address. Open a content-free issue asking the
maintainer to restore the private reporting route, or wait until the private
form is available.

Include the affected commit, impact, reproduction conditions, and a minimal
proof of concept in the private report.

## Trust boundary

Architecture Playground is a single static HTML file. It has a deliberately small
attack surface, and it is worth being precise about why:

- **It executes nothing you supply.** There is no server, no build step, no
  eval of user input, and no code path that runs a workload. Every input is a
  dropdown or a bounded number.
- **It loads no third-party assets.** No scripts, stylesheets, fonts, or images
  come from any other host. This is enforced by `tools/check.mjs` and fails CI
  if broken.
- **It reaches exactly one origin, and only when asked.** Importing a model
  reads public metadata from `https://huggingface.co`. That origin is declared
  once in the file, every request is built from that constant, and no other
  network transport is permitted — `tools/check.mjs` proves all three and fails
  CI otherwise. No request is made until you import something; the rest of the
  page works offline. What leaves the browser is the model id you typed, and
  Hugging Face sees your IP address as it would for any web request. No
  credentials are sent and none are accepted, so only public repositories can
  be read.
- **It sends no telemetry and sets no cookies.** Your plan is saved to
  `localStorage` in your own browser so it can be restored on the next visit;
  it is never transmitted. Load `index.html#fresh` to discard it. A plan link
  encodes the plan into a URL that you choose to share.
- **It executes nothing it fetches.** Imported metadata is parsed as JSON and
  read as data. It is never evaluated, and it reaches the page only as text
  content and as numbers in memory arithmetic.
- **It has no dependencies.** Nothing is installed to run it, so there is no
  supply chain beyond the file itself.

Realistically, the meaningful risks are integrity risks rather than execution
risks: a tampered copy of `index.html` served from somewhere untrusted, or a
figure in the data being wrong. The second is not a vulnerability — report it
through the Data correction issue template.

## What is not a vulnerability

Worker counts, memory figures, and fit verdicts are **memory arithmetic, not
benchmarks or guarantees**. A planner result that does not match what your
hardware actually does is a data or modelling issue, not a security issue.
Verify against real hardware before spending money.
