# RepoMind

Paste a new GitHub issue draft. RepoMind recalls whether this was seen before, cites the evidence, and writes the maintainer reply for you.

RepoMind is a local-first WeMakeDevs x Cognee hackathon MVP. It ingests a curated set of `topoteretes/cognee` GitHub issues into Cognee, then compresses maintainer triage into one paste-and-copy workflow.

## How It Works

RepoMind is not keyword search. Cognee's `remember` pipeline builds graph-vector memory from issue text, labels, modules, exception names, API paths, and comments. The app uses `CHUNKS` recall for citable evidence excerpts, while the demo narration explains how graph-vector memory helps surface conceptually related issues even when the query wording differs from the original issue.

The proof panel keeps source transparency visible: Cognee connection state, dataset state, recall mode, `recallUsed`, fallback status, and top recalled issue numbers. Evidence cards are labeled as either live Cognee evidence or seed fallback evidence so judges can audit what happened.

The demo keeps the full Cognee lifecycle visible:

- `remember`: ingest curated GitHub issues.
- `recall`: retrieve related history for a new issue draft.
- `improve`: thumbs-down feedback requests a memory refresh and immediately re-runs triage.
- `forget`: clear the demo dataset.

## Setup

```bash
cd repomind
cp .env.example .env.local
npm install
npm run dev
```

By default the app expects local Cognee at:

```text
http://localhost:8000
```

Environment variables:

```text
COGNEE_BASE_URL=http://localhost:8000
COGNEE_API_KEY=
GITHUB_TOKEN=
REPOMIND_DATASET=repomind-topoteretes-cognee
```

If GitHub or Cognee is unavailable, RepoMind uses `src/data/seed-issues.json` as a first-class demo fallback. Fallback evidence is visibly labeled and is disabled after `forget` until the user runs ingest again.

## Judge Criteria

- **Best use of Cognee:** Shows the full `remember`, `recall`, `improve`, and `forget` lifecycle, with a proof panel exposing live recall mode, dataset state, and top recalled issue numbers.
- **Impact:** Compresses maintainer triage into one paste-and-copy workflow: paste a draft issue, get a cited verdict, then copy a ready GitHub response.
- **Technical implementation:** Uses Next.js App Router API routes, typed triage contracts, Cognee HTTP APIs, GitHub/seed corpus ingestion, and tests covering fallback truthfulness.
- **UX:** Single compact operational page with status, triage inputs, maintainer brief, draft reply, citable evidence cards, and honest degraded-state messaging.
- **Creativity:** Reframes repository memory as a maintainer copilot instead of a generic search box, making Cognee the product mechanic.

## Demo Script

1. Open the app and say: "RepoMind turns GitHub issue triage into one paste-and-copy workflow."
2. Show status strip: Cognee connected, dataset `repomind-topoteretes-cognee`, issues `0`.
3. Click `Ingest Curated Issues`; show the count reaching the seed/corpus count.
4. Say: "These issues are remembered by Cognee, which builds graph-vector memory over the repo history."
5. Click preset `LLMConfig import fails`.
6. Show triage brief citing `#3774`; say: "RepoMind found the prior issue, explains why it matches, and writes the maintainer response."
7. Say: "One copy, paste into GitHub, done."
8. Say: "This is not keyword search. When RepoMind ingests #3757, Cognee's graph extraction also links it to the broader retry exception handling pattern and the neo4j_driver module. So when a maintainer asks about 'inconsistent error retry behavior,' RepoMind finds #3757 even though that phrase isn't in the issue body. That's the graph layer working."
9. Click thumbs-down on a weak evidence card; show "Cognee improve accepted; re-running triage" when live, or the degraded improve message if unavailable, then refresh the brief from a new Cognee recall.
10. Click preset `deadlock retry inconsistent`; show `#3757`.
11. Click preset `API router error responses`; show `#3748`.
12. Click `Forget Dataset`; re-run a query and show memory cleared or no usable evidence.
13. Close with: "Remember, recall, improve, forget: the full Cognee lifecycle is visible."

## Verification

```bash
npm run lint
npm test
npm run build
```

## AI-Assist Disclosure

Built with AI assistance from Codex/OpenAI during the WeMakeDevs hackathon. Update this section with the final tool list used for submission.
