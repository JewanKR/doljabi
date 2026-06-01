/**
 * JSON conversion between typed objects and the KataGo Analysis Engine's
 * line-delimited wire format, plus type guards for narrowing responses.
 *
 * @module convert
 */
import type { AnyQuery } from "./query.js";
import type { KataGoResponse, AnalysisResult, ErrorResponse, WarningResponse, ActionResponse, VersionResponse } from "./response.js";
/**
 * Serialize a single query to one newline-terminated JSON line, ready to be
 * written to the engine's stdin. Exactly one trailing `"\n"` is appended.
 *
 * `JSON.stringify` drops keys whose value is `undefined`, so optional fields
 * left unset simply do not appear on the wire.
 */
export declare function serializeQuery(query: AnyQuery): string;
/** Serialize many queries into one string — one newline-terminated line each. */
export declare function serializeQueries(queries: readonly AnyQuery[]): string;
/** Result of a non-throwing parse attempt. */
export type ParseOutcome = {
    ok: true;
    response: KataGoResponse;
} | {
    ok: false;
    error: string;
    raw: string;
};
/**
 * Parse one line of engine stdout into a typed response.
 *
 * Throws if the line is empty, is not valid JSON, or is not a recognizable
 * response object. Use {@link tryParseResponse} for a non-throwing variant.
 */
export declare function parseResponse(line: string): KataGoResponse;
/**
 * Non-throwing variant of {@link parseResponse}: returns a wrapper so a read
 * loop can survive a single malformed line.
 */
export declare function tryParseResponse(line: string): ParseOutcome;
/**
 * Split a chunk of stdout (possibly several lines, possibly ending mid-line)
 * into complete responses.
 *
 * Returns the parsed `responses` plus a `remainder` — the trailing partial
 * line, if any — which the caller should prepend to the next chunk. Blank
 * lines are skipped.
 */
export declare function parseResponseLines(chunk: string): {
    responses: ParseOutcome[];
    remainder: string;
};
/** True if the response is a fatal {@link ErrorResponse}. */
export declare function isErrorResponse(r: KataGoResponse): r is ErrorResponse;
/** True if the response acknowledges an action query. */
export declare function isActionResponse(r: KataGoResponse): r is ActionResponse;
/** True if the response answers a `query_version` action. */
export declare function isVersionResponse(r: KataGoResponse): r is VersionResponse;
/** True if the response is an analysis result (partial or completed). */
export declare function isAnalysisResult(r: KataGoResponse): r is AnalysisResult;
/** True if the response is a standalone warning (not attached to a result). */
export declare function isWarningResponse(r: KataGoResponse): r is WarningResponse;
/** True if the response is a partial (mid-search) analysis result. */
export declare function isPartialResult(r: KataGoResponse): r is AnalysisResult;
/** True if the response is a completed (final) analysis result. */
export declare function isCompletedResult(r: KataGoResponse): r is AnalysisResult;
/** True if the response carries `noResults: true` (search produced nothing). */
export declare function hasNoResults(r: KataGoResponse): boolean;
//# sourceMappingURL=convert.d.ts.map