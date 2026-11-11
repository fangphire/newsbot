# Changelog

## Unreleased

- Started Phase 0 feasibility spike.
- Re-verified public OpenRouter, Cloudflare Workers/D1, D1 REST API, and GitHub
  Actions constraints; live account and feed checks remain pending.
- Selected and locally fetched 15 direct-publisher feeds; recorded the owner's
  public-repository, IST digest schedule, and four-alert daily cap decisions.
- Added a dependency-free, no-secret Phase 0 feed-check harness.
- Validated item counts and date fields for all selected feeds; PIB lacks
  per-item dates and will require `first_seen_at` fallback handling.
