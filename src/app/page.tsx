"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Clipboard,
  Database,
  ExternalLink,
  GitBranch,
  RefreshCw,
  SearchCheck,
  ThumbsDown,
  Trash2,
} from "lucide-react";
import { demoPresets } from "@/lib/config";
import type { EvidenceIssue, TriageResponse } from "@/lib/triage/types";

const TERMINAL_STATUSES = ["DATASET_PROCESSING_COMPLETED", "DATASET_PROCESSING_ERROR"];

type StatusResponse = {
  repo: string;
  dataset: string;
  cognee: { connected: boolean; detail: string };
  seedIssueCount: number;
  curatedIssueCount: number;
  datasetExists: boolean;
  datasetStatus: string;
};

type IngestResponse = {
  source: "github" | "seed";
  dataset: string;
  count: number;
  remembered: number;
  errors: string[];
  lastIngestAt: string;
  processingPending: boolean;
  datasetStatus: string;
};

const emptyBrief: TriageResponse | null = null;

export default function Home() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [ingest, setIngest] = useState<IngestResponse | null>(null);
  const [title, setTitle] = useState(demoPresets[0].title);
  const [body, setBody] = useState(demoPresets[0].body);
  const [brief, setBrief] = useState<TriageResponse | null>(emptyBrief);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>("Ready for local demo.");
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [fallbackDisabled, setFallbackDisabled] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef(false);

  async function refreshStatus() {
    const response = await fetch("/api/status");
    setStatus(await response.json());
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      refreshStatus().catch(() => {
        setNotice("Status check failed. The app can still use seed data.");
      });
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      if (pollRef.current) clearInterval(pollRef.current);
      pollingRef.current = false;
    };
  }, []);

  const visibleEvidence = useMemo(() => {
    if (!brief) return [];
    return [...brief.evidence].sort((a, b) => {
      const aDismissed = dismissed.includes(a.number) ? 1 : 0;
      const bDismissed = dismissed.includes(b.number) ? 1 : 0;
      return aDismissed - bDismissed;
    });
  }, [brief, dismissed]);

  const issueCountValue = ingest
    ? `${ingest.remembered}/${ingest.count}`
    : status?.datasetExists
      ? `${status.curatedIssueCount || status.seedIssueCount} curated`
      : "not ingested";

  const fallbackState = fallbackDisabled
    ? "disabled"
    : brief?.fallbackUsed
      ? "seed fallback used"
      : brief
        ? "not used"
        : "waiting";

  async function ingestIssues() {
    setBusy("ingest");
    setNotice("Remembering curated GitHub issues in Cognee...");
    try {
      const response = await fetch("/api/issues/ingest", { method: "POST" });
      const data = await response.json();
      setIngest(data);
      setFallbackDisabled(false);
      await refreshStatus();

      if (data.processingPending) {
        setNotice(`Ingest queued: ${data.remembered}/${data.count} issues. Processing in Cognee...`);
        pollingRef.current = true;
        setBusy("polling");
        startDatasetPolling();
        return;
      } else {
        setNotice(
          `Ingest complete from ${data.source}: ${data.remembered}/${data.count} issues remembered.`,
        );
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Ingest failed.");
    } finally {
      if (!pollingRef.current) setBusy(null);
    }
  }

  function startDatasetPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    let elapsed = 0;
    const maxElapsed = 300;
    pollRef.current = setInterval(async () => {
      elapsed += 5;
      if (elapsed > maxElapsed) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        pollingRef.current = false;
        setBusy(null);
        setNotice("Polling timed out after 5 minutes. Cognee may still be processing.");
        return;
      }
      try {
        const res = await fetch("/api/status");
        const data = await res.json();
        setStatus(data);
        if (TERMINAL_STATUSES.includes(data.datasetStatus)) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          pollingRef.current = false;
          setBusy(null);
          setNotice(
            data.datasetStatus === "DATASET_PROCESSING_COMPLETED"
              ? `Cognee processing complete. Ready for triage.`
              : `Cognee processing finished with status: ${data.datasetStatus}.`,
          );
        } else {
          setNotice(`Processing in Cognee... (${elapsed}s elapsed)`);
        }
      } catch {
        // keep polling on transient errors
      }
    }, 5000);
  }

  async function runTriage(nextTitle = title, nextBody = body) {
    setBusy("triage");
    setNotice("Recalling related repo memory from Cognee...");
    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle, body: nextBody, fallbackDisabled }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Triage failed.");
      setBrief(data);
      setNotice(data.warnings?.[0] || "Triage brief refreshed from remembered evidence.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Triage failed.");
    } finally {
      setBusy(null);
    }
  }

  async function improveAndRerun(issue: EvidenceIssue) {
    setDismissed((current) => Array.from(new Set([...current, issue.number])));
    setBusy(`improve-${issue.number}`);
    setNotice("Submitting Cognee improve feedback; re-running triage");
    try {
      const response = await fetch("/api/memory/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissedIssueNumber: issue.number }),
      });
      const data = await response.json();
      const live = response.ok && data.live === true;
      setNotice(live ? data.message : "Improve unavailable; re-running recall without ranking claim.");
      await runTriage();
      setNotice(
        live
          ? "Cognee improve accepted; triage refreshed from live recall."
          : "Improve unavailable; triage refreshed without ranking claim.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Improve request failed.");
    } finally {
      setBusy(null);
    }
  }

  async function forgetMemory() {
    setBusy("forget");
    setNotice("Forgetting the Repomind dataset...");
    try {
      const response = await fetch("/api/memory/forget", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Forget failed.");
      setBrief(null);
      setIngest(null);
      setFallbackDisabled(true);
      setDismissed([]);
      setNotice("Cognee dataset cleared; seed fallback disabled until ingest is run again.");
      await refreshStatus();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Forget failed.");
    } finally {
      setBusy(null);
    }
  }

  function loadPreset(preset: (typeof demoPresets)[number]) {
    setTitle(preset.title);
    setBody(preset.body);
    setDismissed([]);
    runTriage(preset.title, preset.body);
  }

  async function copyReply() {
    if (!brief?.draftReply) return;
    try {
      await navigator.clipboard.writeText(brief.draftReply);
      setNotice("One copy, paste into GitHub, done.");
    } catch {
      setNotice("Copy failed. Please select and copy the draft manually.");
    }
  }

  return (
    <main className="shell">
      <section className="intro">
        <div>
          <div className="brand">
            <BrainCircuit size={28} />
            <span>RepoMind</span>
          </div>
          <h1>Paste an issue draft. Get the maintainer reply.</h1>
          <p>
            RepoMind recalls whether a bug was seen before, cites the evidence, and writes the
            maintainer response using Cognee graph-vector memory.
          </p>
        </div>
        <div className="sponsor-note">
          <SearchCheck size={18} />
          <span>
            Not keyword search: Cognee links issue text, modules, exception names, API paths, and
            comments into memory.
          </span>
        </div>
      </section>

      <section className="status-strip" aria-label="RepoMind status">
        <StatusItem icon={<GitBranch size={16} />} label="Repo" value={status?.repo || "topoteretes/cognee"} />
        <StatusItem icon={<Database size={16} />} label="Dataset" value={status?.dataset || "repomind-topoteretes-cognee"} />
        <StatusItem
          icon={status?.cognee.connected ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          label="Cognee"
          value={status?.cognee.connected ? "connected" : status?.cognee.detail || "checking"}
        />
        <StatusItem
          icon={<BrainCircuit size={16} />}
          label="Corpus"
          value={issueCountValue}
        />
      </section>

      <section className="action-bar">
        <button className="primary" onClick={ingestIssues} disabled={Boolean(busy)}>
          <Database size={16} />
          {busy === "ingest" ? "Ingesting..." : "Ingest Curated Issues"}
        </button>
        <button className="danger" onClick={forgetMemory} disabled={Boolean(busy)}>
          <Trash2 size={16} />
          Forget Dataset
        </button>
        <p>{notice}</p>
      </section>

      <section className="proof-panel" aria-label="Cognee proof">
        <ProofItem label="Cognee" value={status?.cognee.connected ? "connected" : status?.cognee.detail || "checking"} />
        <ProofItem label="Dataset" value={status?.dataset || "repomind-topoteretes-cognee"} />
        <ProofItem label="Dataset state" value={status?.datasetStatus || "checking"} />
        {busy === "polling" && (
          <ProofItem label="Processing" value="background cognition active" />
        )}
        <ProofItem label="Recall mode" value={brief?.recallMode || "CHUNKS"} />
        <ProofItem label="Recall used" value={brief?.recallUsed ? "yes" : "no"} />
        <ProofItem label="Fallback" value={fallbackState} />
        <ProofItem
          label="Top recalled"
          value={brief?.topRecalledNumbers.length ? brief.topRecalledNumbers.map((number) => `#${number}`).join(", ") : "none yet"}
        />
        {brief?.graphProof && <p className="graph-proof">{brief.graphProof}</p>}
      </section>

      <section className="workspace">
        <div className="panel triage-panel">
          <div className="panel-heading">
            <span>Issue Triage</span>
            <small>Demo presets</small>
          </div>
          <div className="preset-row">
            {demoPresets.map((preset) => (
              <button key={preset.id} className="preset" onClick={() => loadPreset(preset)} disabled={Boolean(busy)}>
                {preset.label}
              </button>
            ))}
          </div>
          <label>
            Issue title
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Issue body
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={8} />
          </label>
          <button className="primary wide" onClick={() => runTriage()} disabled={Boolean(busy)}>
            <RefreshCw size={16} />
            {busy === "triage" ? "Recalling..." : "Run Triage"}
          </button>
        </div>

        <div className="panel brief-panel">
          <div className="panel-heading">
            <span>Maintainer Triage Brief</span>
            {brief && <strong className={`verdict ${brief.verdict}`}>{brief.verdict.replace("_", " ")}</strong>}
          </div>
          {fallbackDisabled && (
            <div className="fallback-banner" style={{ padding: "12px", background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: "6px", marginBottom: "12px", fontSize: "14px" }}>
              <strong>Memory cleared</strong> — no evidence available. Re-ingest issues to restore triage accuracy.
            </div>
          )}
          {brief ? (
            <>
              <div className="brief-block">
                <h2>Why</h2>
                <p>{brief.why}</p>
              </div>
              <div className="brief-block">
                <h2>Suggested action</h2>
                <p>{brief.suggestedAction}</p>
              </div>
              <div className="reply-box">
                <div>
                  <h2>Draft GitHub response</h2>
                  <p>{brief.draftReply}</p>
                </div>
                <button onClick={copyReply}>
                  <Clipboard size={16} />
                  Copy
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <BrainCircuit size={38} />
              <p>Run triage to turn a new issue draft into a cited maintainer decision.</p>
            </div>
          )}
        </div>
      </section>

      <section className="evidence-section">
        <div className="section-heading">
          <h2>Cited evidence</h2>
          <p>
            Each card includes a matched excerpt so the judge can audit why the memory was recalled.
          </p>
        </div>
        <div className="evidence-grid">
          {visibleEvidence.length ? (
            visibleEvidence.map((issue) => (
              <article className={dismissed.includes(issue.number) ? "evidence muted" : "evidence"} key={issue.number}>
                <div className="evidence-top">
                  <div className="evidence-identity">
                    <span>#{issue.number}</span>
                    <strong className={`source-badge ${issue.source}`}>
                      {issue.source === "cognee" ? "Cognee" : "Seed fallback"}
                    </strong>
                  </div>
                  <a href={issue.url} target="_blank" rel="noreferrer">
                    GitHub <ExternalLink size={14} />
                  </a>
                </div>
                <h3>{issue.title}</h3>
                <div className="label-row">
                  <span>{issue.state}</span>
                  {issue.labels.slice(0, 3).map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
                <blockquote>{issue.excerpt}</blockquote>
                <button onClick={() => improveAndRerun(issue)} disabled={Boolean(busy)}>
                  <ThumbsDown size={15} />
                  {busy === `improve-${issue.number}` ? "Updating..." : "Not useful"}
                </button>
              </article>
            ))
          ) : (
            <div className="empty-evidence">No cited evidence yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatusItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="status-item">
      {icon}
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ProofItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="proof-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
