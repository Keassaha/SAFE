import fs from "node:fs";
import ts from "typescript";

const TERMINAL_PATH =
  "/Users/Bookkeeping/.cursor/projects/Users-Bookkeeping-SAAS-SAFE-02/terminals/1.txt";
const SOURCE_PATH =
  "/Users/Bookkeeping/SAAS - SAFE 02/components/layout/Sidebar.tsx";
const ENDPOINT =
  "http://127.0.0.1:7625/ingest/04818075-f511-48cf-9bfe-b5154b454078";
const SESSION_ID = "27010d";

let lastSignature = "";

function sendLog(hypothesisId, message, data) {
  // #region agent log
  fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": SESSION_ID,
    },
    body: JSON.stringify({
      sessionId: SESSION_ID,
      runId: "initial",
      hypothesisId,
      location: "scripts/debug-sidebar-27010d.mjs",
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

function getLineInfo(source, lineNumber) {
  const value = source.split("\n")[lineNumber - 1] ?? "";
  return {
    lineNumber,
    text: value,
    trimmed: value.trim(),
  };
}

function analyzeCurrentState() {
  const terminal = fs.readFileSync(TERMINAL_PATH, "utf8");
  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  const sourceFile = ts.createSourceFile(
    SOURCE_PATH,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const firstDiagnostic = sourceFile.parseDiagnostics[0];
  const snippet356 = getLineInfo(source, 356);
  const snippet357 = getLineInfo(source, 357);
  const snippet358 = getLineInfo(source, 358);
  const snippet359 = getLineInfo(source, 359);
  const snippet360 = getLineInfo(source, 360);
  const snippet361 = getLineInfo(source, 361);
  const snippet362 = getLineInfo(source, 362);
  const parseMatch = terminal.includes("./components/layout/Sidebar.tsx:362:3");
  const exportCascade = terminal.includes("Export Sidebar doesn't exist in target module");
  const api500AfterParse =
    parseMatch && terminal.includes("GET /api/temps/context 500");

  sendLog("H1", "Build error reproduced in dev server output", {
    parseMatch,
    exportCascade,
    api500AfterParse,
  });

  sendLog("H2", "Administrative section condition shape", {
    line356: snippet356.trimmed,
    line357: snippet357.trimmed,
    line358: snippet358.trimmed,
    line359: snippet359.trimmed,
    line360: snippet360.trimmed,
    line361: snippet361.trimmed,
    line362: snippet362.trimmed,
    line361EndsWithLogicalOr: snippet361.trimmed.endsWith("||"),
    line362IsBareCloseParen: snippet362.trimmed === ")",
  });

  sendLog("H3", "First TypeScript parse diagnostic", {
    parseDiagnosticCount: sourceFile.parseDiagnostics.length,
    firstDiagnosticStart: firstDiagnostic?.start ?? null,
    firstDiagnosticLength: firstDiagnostic?.length ?? null,
    firstDiagnosticLine:
      firstDiagnostic == null
        ? null
        : sourceFile.getLineAndCharacterOfPosition(firstDiagnostic.start).line + 1,
    firstDiagnosticCharacter:
      firstDiagnostic == null
        ? null
        : sourceFile.getLineAndCharacterOfPosition(firstDiagnostic.start).character + 1,
    firstDiagnosticMessage:
      firstDiagnostic == null
        ? null
        : ts.flattenDiagnosticMessageText(firstDiagnostic.messageText, "\n"),
  });

  sendLog("H4", "Export exists in source even though build reports none", {
    exportFunctionSidebarExists: source.includes("export function Sidebar"),
    exportCascade,
  });
}

function watchTerminal() {
  const terminal = fs.readFileSync(TERMINAL_PATH, "utf8");
  const relevant = terminal.includes("./components/layout/Sidebar.tsx:362:3");
  const signature = `${terminal.length}:${terminal.lastIndexOf("Expression expected")}`;
  if (relevant && signature !== lastSignature) {
    lastSignature = signature;
    analyzeCurrentState();
  }
}

fs.watchFile(TERMINAL_PATH, { interval: 500 }, watchTerminal);
watchTerminal();
setInterval(() => {}, 1 << 30);
