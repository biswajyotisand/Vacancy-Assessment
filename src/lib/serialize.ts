import type {
  CatValues,
  Row,
  SheetData,
  SheetInfo,
} from "../types";
import type { BottomBreakup, ChannelBreakdown } from "./calc";
import {
  CATS,
  bottomBreakup,
  computeAll,
  fieldTotal,
  getGroups,
  isDRQ,
  isExtraCat,
  normalizeRow,
  sumCat,
} from "./calc";

export const STORAGE_KEY = "ir-vacancy-sheet-v1";

export function toSheetData(rows: Row[], info: SheetInfo): SheetData {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    info: { ...info },
    rows: rows.map((r) => normalizeRow(r)),
  };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function chips(obj: CatValues): string {
  return `<span class="sub">${CATS.map(
    (c) => `<i class="c-${c}">${c}:${obj[c] || 0}</i>`
  ).join("")}</span>`;
}

function editableCellHTML(
  row: ReturnType<typeof computeAll>[number],
  field: "ss" | "or" | "anticipated"
): string {
  const applicable = isDRQ(row.intake);
  const shown = CATS.filter((c) => applicable || !isExtraCat(c));
  return `<td><b>${fieldTotal(row, field)}</b><span class="sub">${shown
    .map((c) => `<i class="c-${c}">${c}:${row[field][c] || 0}</i>`)
    .join("")}</span></td>`;
}

function computedCellHTML(obj: CatValues): string {
  return `<td><b>${sumCat(obj)}</b>${chips(obj)}</td>`;
}

function breakupPanelHTML(b: BottomBreakup): string {
  const chipHTML = (obj: CatValues): string =>
    CATS.map((c) => `<i class="c-${c}">${c}:${obj[c] || 0}</i>`).join("");

  const channelHTML = (ch: ChannelBreakdown): string => {
    const exT = sumCat(ch.existing);
    const anT = sumCat(ch.anticipated);
    const cls = ch.intake === "DRQ" ? ' class="drq-badge"' : "";
    return `<tr>
      <td class="ch-label"><b${cls}>${ch.label}</b></td>
      <td class="b-tot">${exT}<span class="sub">${chipHTML(ch.existing)}</span></td>
      <td class="b-tot">${anT}<span class="sub">${chipHTML(ch.anticipated)}</span></td>
    </tr>`;
  };

  const poolTR = (label: string, ex: CatValues, an: CatValues): string => {
    const exT = sumCat(ex);
    const anT = sumCat(an);
    return `<tr class="pool">
      <td class="ch-label"><b>${label}</b></td>
      <td class="b-tot">${exT}<span class="sub">${chipHTML(ex)}</span></td>
      <td class="b-tot">${anT}<span class="sub">${chipHTML(an)}</span></td>
    </tr>`;
  };

  const exDistTotal = b.channels.reduce(
    (s: number, c: ChannelBreakdown) => s + sumCat(c.existing),
    0
  );
  const anDistTotal = b.channels.reduce(
    (s: number, c: ChannelBreakdown) => s + sumCat(c.anticipated),
    0
  );

  return `<div class="breakup">
    <h3>Percentage-wise Breakup of Higher Post Vacancies</h3>
    <p class="breakup-sub">Distributed to <b>${esc(
      b.postName
    )}</b> · DPQ &amp; LDCE of higher posts only · nearest-integer allocation with balancing last channel · DRQ UR carved into OBC 27% / EWS 10%</p>
    <table class="breakup-table">
      <thead>
        <tr><th>Channel</th><th>Existing Vac. Share</th><th>Anticipated Vac. Share</th></tr>
      </thead>
      <tbody>
        ${b.channels.map(channelHTML).join("")}
        ${poolTR("Higher-post pool (DPQ + LDCE)", b.existingPool, b.anticipatedPool)}
      </tbody>
    </table>
    <p class="breakup-reconcile">Reconciled: Existing ${sumCat(
      b.existingPool
    )} = ${exDistTotal}, Anticipated ${sumCat(b.anticipatedPool)} = ${anDistTotal}</p>
  </div>`;
}

/**
 * Builds a fully self-contained, printable HTML snapshot of the sheet with the
 * raw data embedded as JSON inside <script id="embeddedData">, so the file can
 * be re-imported later to continue editing.
 */
export function exportSheetHTML(data: SheetData): string {
  const computed = computeAll(data.rows);
  const groups = getGroups(data.rows);
  const breakup = bottomBreakup(computed);
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  let bodyRows = "";
  groups.forEach((g) => {
    const size = g.end - g.start + 1;
    for (let idx = g.start; idx <= g.end; idx++) {
      const r = computed[idx];
      bodyRows += `<tr${idx === g.start ? ' class="gstart"' : ""}>`;
      if (idx === g.start) {
        bodyRows += `<td class="post" rowspan="${size}">${esc(
          r.postName || "—"
        )}</td>`;
      }
      bodyRows += `<td>${r.intake}</td>`;
      bodyRows += `<td>${r.intakePercent || 0}%</td>`;
      bodyRows += editableCellHTML(r, "ss");
      bodyRows += editableCellHTML(r, "or");
      bodyRows += computedCellHTML(r.existing);
      bodyRows += editableCellHTML(r, "anticipated");
      bodyRows += computedCellHTML(r.chain);
      bodyRows += `<td class="tot"><b>${sumCat(r.total)}</b>${chips(r.total)}</td>`;
      bodyRows += `<td class="rem">${esc(r.remarks || "")}</td>`;
      bodyRows += "</tr>";
    }
  });

  const savedOn = new Date(data.savedAt).toLocaleString("en-IN");
  const breakupHTML = breakup ? breakupPanelHTML(breakup) : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Vacancy Assessment | ${esc(data.info.department || "Indian Railways")}</title>
<style>
  *{box-sizing:border-box;font-family:'Segoe UI',Arial,sans-serif;}
  body{margin:0;background:#f2f5f9;color:#0d3357;padding-bottom:32px;}
  .tri{display:flex;height:6px;}.tri i{flex:1;}
  header{background:linear-gradient(135deg,#0a2540,#003366 60%,#1e5a8f);color:#fff;text-align:center;padding:20px 16px 24px;}
  header .tag{font-size:12px;letter-spacing:2px;color:#ff9933;font-weight:600;margin-bottom:4px;}
  header h1{margin:0;font-size:28px;font-weight:800;} header h1 span{color:#ff9933;}
  header p{margin:6px 0 0;color:#cfe0f0;font-size:13px;}
  .info{max-width:1200px;margin:-16px auto 18px;background:#fff;border-radius:12px;border-top:4px solid #ff9933;box-shadow:0 8px 24px rgba(10,37,64,.12);padding:14px 20px;display:flex;gap:24px;flex-wrap:wrap;}
  .info div{flex:1;min-width:200px;}
  .info label{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#7d8ea3;margin-bottom:2px;}
  .info b{font-size:15px;}
  .wrap{max-width:1200px;margin:0 auto;overflow-x:auto;background:#fff;border-radius:12px;box-shadow:0 8px 24px rgba(10,37,64,.1);padding:12px;}
  table{border-collapse:collapse;width:100%;min-width:1100px;}
  th,td{border:1px solid #dbe4ee;padding:5px 4px;text-align:center;vertical-align:middle;font-size:11.5px;}
  th{background:#0d3357;color:#fff;font-size:10.5px;text-transform:uppercase;letter-spacing:.3px;}
  tr.gstart td{border-top:2.5px solid #b9c9db;}
  td b{font-size:13px;display:block;}
  .post{font-weight:800;}
  .tot{background:#fff3e0;}
  .rem{font-size:11px;}
  .sub{display:flex;gap:3px;justify-content:center;flex-wrap:wrap;margin-top:2px;}
  .sub i{font-style:normal;font-size:9px;font-weight:700;}
  .c-UR{color:#1565c0}.c-SC{color:#e65100}.c-ST{color:#138808}.c-OBC{color:#6a1b9a}.c-EWS{color:#00838f}
  .note{text-align:center;color:#7d8ea3;font-size:11px;margin-top:18px;}
  /* percentage-wise breakup panel */
  .breakup{max-width:1200px;margin:18px auto 0;background:#fff;border-radius:12px;box-shadow:0 8px 24px rgba(10,37,64,.1);border-top:4px solid #ff9933;padding:14px 18px;}
  .breakup h3{margin:0 0 4px;font-size:15px;font-weight:800;color:#0a2540;}
  .breakup-sub{margin:0 0 10px;font-size:11px;color:#546882;}
  .breakup-sub b{color:#0a2540;}
  .breakup-table{border-collapse:collapse;width:100%;}
  .breakup-table th{background:#10406d;font-size:10.5px;}
  .breakup-table td{border:1px solid #dbe4ee;font-size:12px;}
  .breakup-table tr.pool td{background:#eef5fc;font-weight:800;}
  .b-tot{font-size:14px;font-weight:800;color:#0d3357;}
  .ch-label b{background:#e8edf4;padding:1px 8px;border-radius:4px;font-size:11px;}
  .ch-label b.drq-badge{background:#fff3e0;color:#e65100;}
  .breakup-reconcile{margin:8px 0 0;font-size:10px;color:#138808;font-weight:700;text-align:right;}
  @media print{
    body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .wrap{box-shadow:none;overflow:visible;}
    .breakup{box-shadow:none;border:1px solid #cbd5e1;border-top:4px solid #ff9933;}
    .info{box-shadow:none;border:1px solid #cbd5e1;border-top:4px solid #ff9933;}
    table{min-width:0;}
    th,td{font-size:9px;padding:3px 2px;}
    tr{page-break-inside:avoid;}
    thead{display:table-header-group;}
    @page{size:landscape;margin:8mm;}
  }
</style>
</head>
<body>
<div class="tri"><i style="background:#ff9933"></i><i style="background:#fff"></i><i style="background:#138808"></i></div>
<header>
  <div class="tag">भारतीय रेल • INDIAN RAILWAYS</div>
  <h1>Vacancy <span>Assessment</span></h1>
  <p>Vacancy Calculation Sheet</p>
</header>
<div class="info">
  <div><label>Department</label><b>${esc(data.info.department || "—")}</b></div>
  <div><label>Cadre</label><b>${esc(data.info.cadre || "—")}</b></div>
  <div><label>Assessment Period</label><b>${esc(data.info.period || "—")}</b></div>
</div>
<div class="wrap">
<table>
  <thead><tr><th>Post</th><th>Intake</th><th>Intake %</th><th>S/S</th><th>O/R</th><th>Existing Vac.</th><th>Anticipated Vac.</th><th>Chain Vac.</th><th>Total Vac.</th><th>Remarks</th></tr></thead>
  <tbody>${bodyRows}</tbody>
</table>
</div>
${breakupHTML}
<p class="note">Saved on ${esc(
    savedOn
  )} • Re-import this file into the Vacancy Assessment Tool to continue editing.</p>
<script id="embeddedData" type="application/json">${json}</script>
</body>
</html>`;
}

/** Extracts embedded sheet data from a previously saved HTML file. */
export function parseImportedHTML(text: string): {
  rows: Row[];
  info: SheetInfo;
} {
  const match = text.match(
    /<script id="embeddedData"[^>]*>([\s\S]*?)<\/script>/i
  );
  if (!match) throw new Error("No embedded data found in this file");
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[1].trim());
  } catch {
    throw new Error("Embedded data is corrupted");
  }
  const p = parsed as Partial<SheetData> | null;
  if (!p || !Array.isArray(p.rows) || p.rows.length === 0)
    throw new Error("No rows found in this file");
  return {
    rows: p.rows.map((r) => normalizeRow(r)),
    info: {
      department:
        typeof p.info?.department === "string" ? p.info.department : "",
      cadre: typeof p.info?.cadre === "string" ? p.info.cadre : "",
      period: typeof p.info?.period === "string" ? p.info.period : "",
    },
  };
}
