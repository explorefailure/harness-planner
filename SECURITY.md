# Security policy

## Supported versions

No Harness Planner version has been published yet. Untagged commits and
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

<https://github.com/explorefailure/harness-planner/security/advisories/new>

If that link does not present a private report form, **do not post exploit
details or proof-of-concept code in a public issue**. There is currently no
published security email address. Open a content-free issue asking the
maintainer to restore the private reporting route, or wait until the private
form is available.

Include the affected commit, impact, reproduction conditions, and a minimal
proof of concept in the private report.

## Trust boundary

Harness Planner is a single static HTML file. It has a deliberately small
attack surface, and it is worth being precise about why:

- **It executes nothing you supply.** There is no server, no build step, no
  eval of user input, and no code path that runs a workload. Every input is a
  dropdown or a bounded number.
- **It makes no network requests.** The page loads no scripts, stylesheets,
  fonts, or images from any other host. This is enforced by `tools/check.mjs`
  and fails CI if broken. The only external URLs are citation links a reader
  chooses to click.
- **It collects and stores nothing.** No cookies, no local storage, no
  telemetry, no analytics. Reloading the page discards all state.
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
