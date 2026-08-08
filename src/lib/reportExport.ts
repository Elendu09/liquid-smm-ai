/**
 * Report export pipeline.
 *
 * Fix 5.2 — "unexportable widgets" pain. CSV exports use a stable
 * columnar shape (date, platform, metric, value) so downstream BI tools
 * (Sheets, BigQuery, Notion) can ingest without cleanup. PDF exports
 * capture the rendered charts and tables as a printable document.
 *
 * Both pipelines are pure functions over a `ReportPayload` so they
 * can be called from any surface (composer, run history, scheduled
 * email).
 */

import type { ReportData } from "@/lib/reportAnalytics";

export interface ReportPayload {
  name: string;
  period: string;
  generatedAt: string;
  platform?: string;
  /** Per-metric rows used by CSV / PDF. */
  metrics: Array<{ label: string; value: number; unit?: string; delta?: number; platform?: string }>;
  /** Per-day series (date, value, platform?). */
  series: Array<{ date: string; value: number; platform?: string; metric?: string }>;
  /** Optional headline summary lines. */
  summary: string[];
  /** Optional pre-rendered chart image data URLs (used for PDF). */
  chartImages?: Array<{ title: string; dataUrl: string; width?: number; height?: number }>;
  /** Timezone label that the report was generated in. */
  timezone?: string;
}

/* -------------------- CSV -------------------- */

function csvEscape(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(payload: ReportPayload): string {
  const lines: string[] = [];
  // 1) Header block (name, period, generated, platform, timezone)
  lines.push(`# ${csvEscape(payload.name)}`);
  lines.push(`# Period,${csvEscape(payload.period)}`);
  lines.push(`# Generated,${csvEscape(payload.generatedAt)}`);
  if (payload.platform) lines.push(`# Platform,${csvEscape(payload.platform)}`);
  if (payload.timezone) lines.push(`# Timezone,${csvEscape(payload.timezone)}`);
  lines.push("");
  // 2) Summary section
  lines.push("Section,Summary");
  payload.summary.forEach((s) => lines.push(`Summary,${csvEscape(s)}`));
  lines.push("");
  // 3) Metrics table
  lines.push("Metric,Platform,Value,Unit,Delta");
  payload.metrics.forEach((m) => {
    lines.push([
      csvEscape(m.label),
      csvEscape(m.platform ?? ""),
      csvEscape(m.value),
      csvEscape(m.unit ?? ""),
      csvEscape(m.delta ?? ""),
    ].join(","));
  });
  lines.push("");
  // 4) Series table (the long table BI tools actually want).
  lines.push("Date,Platform,Metric,Value");
  payload.series.forEach((p) => {
    lines.push([
      csvEscape(p.date),
      csvEscape(p.platform ?? ""),
      csvEscape(p.metric ?? ""),
      csvEscape(p.value),
    ].join(","));
  });
  return lines.join("\n");
}

export function downloadCsv(payload: ReportPayload, filename: string) {
  if (typeof window === "undefined") return;
  const csv = toCsv(payload);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* -------------------- PDF -------------------- */

/**
 * Generate a printable HTML document for the report. We then open a
 * print window so the user can save as PDF (works on every browser
 * without a 3rd-party library). Charts are inlined as <img> from the
 * `chartImages` array.
 */
export function toPrintableHtml(payload: ReportPayload): string {
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
  const styles = `
    @page { size: A4; margin: 18mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; line-height: 1.45; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .meta { color: #64748b; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    .summary li { margin: 2px 0; }
    .chart { margin: 12px 0; page-break-inside: avoid; }
    .chart img { max-width: 100%; border: 1px solid #e2e8f0; border-radius: 6px; }
    .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 9px; text-align: center; }
  `;
  const rows = payload.metrics.map((m) =>
    `<tr><td>${esc(m.label)}</td><td>${esc(m.platform ?? "—")}</td><td>${formatNum(m.value)}${esc(m.unit ?? "")}</td><td>${m.delta !== undefined ? (m.delta >= 0 ? "+" : "") + m.delta.toFixed(1) + "%" : "—"}</td></tr>`
  ).join("");
  const series = payload.series.slice(0, 200).map((p) =>
    `<tr><td>${esc(p.date)}</td><td>${esc(p.platform ?? "—")}</td><td>${esc(p.metric ?? "—")}</td><td>${formatNum(p.value)}</td></tr>`
  ).join("");
  const charts = (payload.chartImages ?? []).map((c) =>
    `<div class="chart"><h2>${esc(c.title)}</h2><img src="${c.dataUrl}" alt="${esc(c.title)}" /></div>`
  ).join("");
  return `<!doctype html>
<html><head><meta charset="utf-8" /><title>${esc(payload.name)}</title><style>${styles}</style></head>
<body>
  <h1>${esc(payload.name)}</h1>
  <p class="meta">${esc(payload.period)} · generated ${esc(payload.generatedAt)}${payload.platform ? ` · ${esc(payload.platform)}` : ""}${payload.timezone ? ` · ${esc(payload.timezone)}` : ""}</p>
  <h2>Summary</h2>
  <ul class="summary">${payload.summary.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
  <h2>Metrics</h2>
  <table><thead><tr><th>Metric</th><th>Platform</th><th>Value</th><th>Δ</th></tr></thead><tbody>${rows}</tbody></table>
  ${charts ? `<h2>Charts</h2>${charts}` : ""}
  <h2>Series (first 200 rows)</h2>
  <table><thead><tr><th>Date</th><th>Platform</th><th>Metric</th><th>Value</th></tr></thead><tbody>${series}</tbody></table>
  <div class="footer">SMMSAAS · ${esc(payload.name)}</div>
</body></html>`;
}

export function openPrintablePdf(payload: ReportPayload) {
  if (typeof window === "undefined") return;
  const html = toPrintableHtml(payload);
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  // Wait briefly for images to layout, then trigger print.
  setTimeout(() => { try { w.focus(); w.print(); } catch { /* user closed window */ } }, 400);
}

function formatNum(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

/** Convenience builder: convert the existing `ReportData` shape into a payload. */
export function payloadFromReportData(data: ReportData, opts: { name: string; period: string; platform?: string; timezone?: string }): ReportPayload {
  const metrics = Object.entries(data).flatMap(([section, rows]) =>
    Array.isArray(rows) ? rows.map((r) => ({
      label: r.label ?? section,
      value: r.value,
      unit: r.unit,
      delta: r.delta,
      platform: r.platform,
    })) : []
  );
  const series = Object.entries(data).flatMap(([section, rows]) =>
    Array.isArray(rows) ? rows.flatMap((r) => Array.isArray(r.series) ? r.series.map((p) => ({
      date: p.date,
      value: p.value,
      platform: r.platform,
      metric: r.label ?? section,
    })) : []) : []
  );
  const summary = metrics.slice(0, 4).map((m) => `${m.label}: ${formatNum(m.value)}${m.unit ?? ""}${m.delta !== undefined ? ` (${m.delta >= 0 ? "+" : ""}${m.delta.toFixed(1)}%)` : ""}`);
  return {
    name: opts.name,
    period: opts.period,
    generatedAt: new Date().toISOString(),
    platform: opts.platform,
    timezone: opts.timezone,
    metrics,
    series,
    summary,
  };
}
