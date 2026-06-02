/**
 * Round-trip smoke test: build a query, serialize it, parse sample engine
 * responses, and exercise the type guards.
 *
 * Run after `npm run build` with:
 *
 *     node dist/examples/roundtrip.js
 *
 * @module examples/roundtrip
 */
import { createAnalysisQuery, createIdGenerator, serializeQuery, parseResponse, isAnalysisResult, isCompletedResult, isPartialResult, isErrorResponse, } from "../index.js";
function assert(condition, message) {
    if (!condition)
        throw new Error(`Assertion failed: ${message}`);
    console.log(`  ok - ${message}`);
}
// --- 1. Build and serialize a query ----------------------------------------
console.log("1. serialize query");
const nextId = createIdGenerator();
const query = createAnalysisQuery({
    id: nextId(),
    moves: [
        ["B", "Q16"],
        ["W", "D4"],
    ],
    maxVisits: 100,
    includeOwnership: true,
});
const line = serializeQuery(query);
console.log(`   ${line.trimEnd()}`);
assert(line.endsWith("\n"), "serialized query ends with a newline");
assert(line.indexOf("\n") === line.length - 1, "serialized query is a single line");
assert(query.id === "QUERY:1", "id generator produced QUERY:1");
// --- 2. Parse a completed analysis result ----------------------------------
console.log("2. parse completed analysis result");
const completedLine = JSON.stringify({
    id: "QUERY:1",
    turnNumber: 2,
    moveInfos: [
        {
            move: "D16",
            visits: 60,
            winrate: 0.512,
            scoreLead: 0.8,
            prior: 0.21,
            order: 0,
            pv: ["D16", "Q4"],
        },
    ],
    rootInfo: {
        winrate: 0.5,
        scoreLead: 0.3,
        visits: 100,
        currentPlayer: "B",
    },
    ownership: [0.1, -0.2, 0.0],
});
const completed = parseResponse(completedLine);
assert(isAnalysisResult(completed), "recognized as an analysis result");
assert(isCompletedResult(completed), "recognized as a completed (final) result");
assert(!isPartialResult(completed), "not flagged as a partial result");
if (isAnalysisResult(completed)) {
    console.log(`   rootInfo.winrate = ${completed.rootInfo.winrate}`);
    console.log(`   top move = ${completed.moveInfos[0]?.move}`);
    assert(completed.isDuringSearch === false, "missing isDuringSearch normalized to false");
}
// --- 3. Parse an error response --------------------------------------------
console.log("3. parse error response");
const errorLine = JSON.stringify({
    id: "QUERY:2",
    error: "Could not parse rules",
    field: "rules",
});
const errored = parseResponse(errorLine);
assert(isErrorResponse(errored), "recognized as an error response");
if (isErrorResponse(errored)) {
    console.log(`   error = ${errored.error}`);
}
// --- 4. Parse a partial (during-search) result -----------------------------
console.log("4. parse partial (during-search) result");
const partialLine = JSON.stringify({
    id: "QUERY:1",
    turnNumber: 2,
    isDuringSearch: true,
    moveInfos: [],
    rootInfo: {
        winrate: 0.49,
        scoreLead: -0.1,
        visits: 12,
        currentPlayer: "B",
    },
});
const partial = parseResponse(partialLine);
assert(isPartialResult(partial), "recognized as a partial result");
assert(!isCompletedResult(partial), "not flagged as a completed result");
console.log("\nAll round-trip checks passed.");
//# sourceMappingURL=roundtrip.js.map