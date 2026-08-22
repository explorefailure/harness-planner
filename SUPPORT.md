# Support for Architecture Playground

Architecture Playground is a solo-maintained open-source project. Help is provided on a
best-effort basis; there is no guaranteed response time, resolution,
compatibility exception, or support SLA.

## Where to ask

Use [GitHub Issues](https://github.com/explorefailure/architecture-playground/issues)
for usage questions and non-sensitive bug reports. Search existing issues
first, and pick the template that matches:

- **Data correction** — a hardware specification or model figure is wrong or
  out of date. This is the most useful report this project can receive, because
  every displayed number is meant to trace back to a primary source.
- **Bug report** — the page misbehaves. Include the commit, your browser, and
  the exact selection (model, machine, precision, context) that reproduces it.
  The planner is stateless, so that selection is the whole reproduction.
- **Change proposal** — a new model, a new machine, or a change in behaviour.

Questions about browsers older than the current and previous major release, or
about deployment environments, may be answered when capacity permits but are
not compatibility commitments.

## What this project will not do

It will not add a figure that cannot be traced to a primary source. If a vendor
does not publish a number, or two sources disagree and neither is
authoritative, the honest outcome is a gap rather than a plausible-looking
value. Proposals that require inventing a number will be declined on those
grounds rather than on merit.

It will not rank hardware or score it. The planner reports what fits and says
where a number came from; choosing between builds is the reader's job.

## Security issues

Do not report vulnerabilities, exploit details, or proof-of-concept code in a
public issue. Use the private route in [SECURITY.md](SECURITY.md).
