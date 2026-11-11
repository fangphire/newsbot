# Phase 0 feasibility spike

Status: **partially complete; awaiting the credential-backed checks**
(checked 2026-11-11 UTC).

This report verifies public platform constraints only. It deliberately contains no
credentials, account IDs, or tokens.

## Decision

The proposed architecture remains technically feasible on the published free
tiers. The GitHub Actions ingestion job must keep its D1 REST traffic small and
batched: Cloudflare describes the built-in REST API as best suited to
administrative use because the global Cloudflare API rate limit applies. A
15-minute, single-user ingestion job is a reasonable fit, but this must be
confirmed using the owner's actual account in the checks below.

No hard constraint has yet been disproved. Phase 0 cannot pass until the
candidate feeds and the required service credentials/resources are available.

## Verified published limits

| Service | Roadmap assumption | Current official documentation | Result |
| --- | --- | --- | --- |
| OpenRouter free `:free` models | 20 requests/minute; 50/day | 20 RPM and 50/day; failed attempts count. The daily cap rises only after buying at least $10 of credits, which this project will not do. | Matches |
| Cloudflare Workers Free | 100,000 requests/day; 10 ms CPU; 128 MB; 50 subrequests | 100,000 requests/day; 10 ms CPU per HTTP request and cron; 128 MB; 50 subrequests/request. | Matches |
| Cloudflare D1 Free | 5M rows read/day; 100k rows written/day; 5 GB | 5M rows read/day; 100k rows written/day; 5 GB total account storage. A free database is limited to 500 MB. | Matches; add 500 MB/database limit |
| GitHub Actions | scheduled jobs can be late; allowance depends on visibility/plan | Public repositories using standard GitHub-hosted runners are free. Private repositories consume the owner's plan allowance. | Needs repository visibility and owner plan |
| D1 from Actions | D1 REST API access | `POST /accounts/{account_id}/d1/database/{database_id}/query` accepts API-token authentication with D1 Read/D1 Write permission. | Endpoint confirmed; live token check pending |

Official sources: [OpenRouter free models](https://openrouter.ai/collections/free-models/), [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [Cloudflare D1 API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/), and [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

## Required live checks

| Check | Status | Evidence needed |
| --- | --- | --- |
| Fetch and parse 15 candidate feeds from a GitHub Actions run | Pending | Feed URLs plus a repository/workflow that can run |
| Fetch the same feeds from a Worker; record failures, blocks, and missing dates | Passed | Deployed Worker fetched all 15 feeds successfully (HTTP 200). |
| Measure Worker RSS parse CPU time | Passed for the lightweight counting parser | The representative 218 KB feed returned `parseMs: 0` at the Worker timer's millisecond precision. The later production XML parser still needs its own measurement. |
| Execute a parameterized D1 REST query from Actions | Pending | D1 database and least-privilege API token stored as a GitHub secret |
| Confirm a `:free` OpenRouter model call and capture response limit headers | Pending | OpenRouter key stored as a secret |

## Candidate-feed results

The owner approved feed selection. The shortlist is based on the stated focus:
India, global politics/geopolitics, and economics. All feeds below were fetched
successfully once from a local test on 2026-11-11. This is not a substitute for
the required GitHub Actions and Workers tests.

| Tier | Publisher and focus | URL | Local result |
| --- | --- | --- | --- |
| 1 | Press Information Bureau — Government of India releases | https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3 | 200, XML, 20 items; **no per-item date** |
| 1 | United Nations News — global | https://news.un.org/feed/subscribe/en/news/all/rss.xml | 200, RSS, 30 items, 31 date fields |
| 2 | BBC News — world | https://feeds.bbci.co.uk/news/world/rss.xml | 200, XML, 23 items, 23 date fields |
| 2 | BBC News — business | https://feeds.bbci.co.uk/news/business/rss.xml | 200, XML, 52 items, 52 date fields |
| 2 | BBC News — India | https://feeds.bbci.co.uk/news/world/asia/india/rss.xml | 200, XML, 22 items, 22 date fields |
| 2 | BBC News — Middle East | https://feeds.bbci.co.uk/news/world/middle_east/rss.xml | 200, XML, 27 items, 27 date fields |
| 2 | BBC News — United States and Canada | https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml | 200, XML, 26 items, 26 date fields |
| 2 | BBC News — Europe | https://feeds.bbci.co.uk/news/world/europe/rss.xml | 200, XML, 23 items, 23 date fields |
| 2 | Al Jazeera — global | https://www.aljazeera.com/xml/rss/all.xml | 200, RSS, 25 items, 25 date fields |
| 2 | The Indian Express — India | https://indianexpress.com/section/india/feed/ | 200, RSS, 200 items, 200 date fields |
| 2 | The Indian Express — world | https://indianexpress.com/section/world/feed/ | 200, RSS, 200 items, 200 date fields |
| 2 | The Indian Express — economy | https://indianexpress.com/section/business/economy/feed/ | 200, RSS, 200 items, 200 date fields |
| 2 | Hindustan Times — India | https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml | 200, XML, 100 items, 100 date fields |
| 2 | NPR — world | https://feeds.npr.org/1004/rss.xml | 200, XML, 10 items, 10 date fields |
| 2 | NPR — business | https://feeds.npr.org/1014/rss.xml | 200, XML, 10 items, 10 date fields |

The legacy Reuters URL `https://feeds.reuters.com/reuters/topNews` was also
tested but its hostname did not resolve. It is excluded from the shortlist.

The Phase 0 checker is [`spike/check-feeds.mjs`](spike/check-feeds.mjs). It
uses only Node's built-in APIs, fetches no credentials, and can be replayed.
The largest individual feeds are the three Indian Express feeds (about 218 KB
each); they are representative payloads for the Worker CPU test. The deployed
Worker test completed all 15 requests successfully. Its lightweight item-count
parser recorded 0 ms on the available timer precision for the largest response;
network wait is not Worker CPU time. PIB must use `first_seen_at` when it does
not supply a usable publication date.

## Owner decisions

| Setting | Decision |
| --- | --- |
| GitHub repository | Public |
| Digest schedule | 10:00 and 20:00 Asia/Kolkata (IST) |
| Maximum immediate alerts | 4 per day |
| Feed selection | Owner-approved shortlist above |

## Phase 0 acceptance criteria

- [x] Published constraints re-verified against official documentation.
- [x] Fifteen candidate feeds fetched successfully from the feasibility environment.
- [ ] Fifteen candidate feeds tested from GitHub Actions.
- [x] Fifteen candidate feeds tested from the deployed Worker (all HTTP 200).
- [x] Lightweight Worker parse CPU measured (0 ms at timer precision for the representative payload).
- [ ] D1 REST API tested from Actions.
- [ ] OpenRouter free model and response headers tested.
- [ ] Working-feed list, measurements, and final decision recorded.
