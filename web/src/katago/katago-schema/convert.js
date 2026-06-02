/**
 * JSON conversion between typed objects and the KataGo Analysis Engine's
 * line-delimited wire format, plus type guards for narrowing responses.
 *
 * @module convert
 */
// ---------------------------------------------------------------------------
// Serialization: typed query  ->  JSON line for the engine's stdin
// ---------------------------------------------------------------------------
/**
 * Serialize a single query to one newline-terminated JSON line, ready to be
 * written to the engine's stdin. Exactly one trailing `"\n"` is appended.
 *
 * `JSON.stringify` drops keys whose value is `undefined`, so optional fields
 * left unset simply do not appear on the wire.
 */
export function serializeQuery(query) {
    return JSON.stringify(query) + "\n";
}
/** Serialize many queries into one string — one newline-terminated line each. */
export function serializeQueries(queries) {
    return queries.map(serializeQuery).join("");
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
 * Classify an already-parsed JSON object into the {@link KataGoResponse}
 * union. Discrimination is by field presence, in the same order KaTrain's
 * engine reader uses. Throws if the object is not a recognizable response.
 */
function classify(obj) {
    if (typeof obj["id"] !== "string") {
        throw new Error('KataGo response is missing a string "id" field');
    }
    if ("error" in obj)
        return obj;
    if ("action" in obj)
        return obj;
    if ("version" in obj)
        return obj;
    if ("rootInfo" in obj || "moveInfos" in obj || "isDuringSearch" in obj) {
        // `isDuringSearch` is optional on the wire; normalize to a real boolean so
        // downstream code (and `isPartialResult` / `isCompletedResult`) can rely
        // on it. Mirrors KaTrain's `analysis.get("isDuringSearch", False)`.
        obj["isDuringSearch"] = obj["isDuringSearch"] === true;
        return obj;
    }
    if ("warning" in obj)
        return obj;
    throw new Error("Unrecognized KataGo response shape");
}
/**
 * Parse one line of engine stdout into a typed response.
 *
 * Throws if the line is empty, is not valid JSON, or is not a recognizable
 * response object. Use {@link tryParseResponse} for a non-throwing variant.
 */
export function parseResponse(line) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
        throw new Error("Cannot parse an empty line as a KataGo response");
    }
    let parsed;
    try {
        parsed = JSON.parse(trimmed);
    }
    catch (cause) {
        const detail = cause instanceof Error ? cause.message : String(cause);
        throw new Error(`Invalid JSON in KataGo response: ${detail}`);
    }
    if (!isRecord(parsed)) {
        throw new Error("KataGo response is not a JSON object");
    }
    return classify(parsed);
}
/**
 * Non-throwing variant of {@link parseResponse}: returns a wrapper so a read
 * loop can survive a single malformed line.
 */
export function tryParseResponse(line) {
    try {
        return { ok: true, response: parseResponse(line) };
    }
    catch (cause) {
        const error = cause instanceof Error ? cause.message : String(cause);
        return { ok: false, error, raw: line };
    }
}
/**
 * Split a chunk of stdout (possibly several lines, possibly ending mid-line)
 * into complete responses.
 *
 * Returns the parsed `responses` plus a `remainder` — the trailing partial
 * line, if any — which the caller should prepend to the next chunk. Blank
 * lines are skipped.
 */
export function parseResponseLines(chunk) {
    const segments = chunk.split("\n");
    const remainder = segments.pop() ?? "";
    const responses = [];
    for (const segment of segments) {
        if (segment.trim().length === 0)
            continue;
        responses.push(tryParseResponse(segment));
    }
    return { responses, remainder };
}
// ---------------------------------------------------------------------------
// Type guards: narrow a KataGoResponse to a concrete member
// ---------------------------------------------------------------------------
/** True if the response is a fatal {@link ErrorResponse}. */
export function isErrorResponse(r) {
    return "error" in r;
}
/** True if the response acknowledges an action query. */
export function isActionResponse(r) {
    return "action" in r;
}
/** True if the response answers a `query_version` action. */
export function isVersionResponse(r) {
    return "version" in r;
}
/** True if the response is an analysis result (partial or completed). */
export function isAnalysisResult(r) {
    return "rootInfo" in r || "moveInfos" in r || "isDuringSearch" in r;
}
/** True if the response is a standalone warning (not attached to a result). */
export function isWarningResponse(r) {
    return "warning" in r && !isAnalysisResult(r);
}
/** True if the response is a partial (mid-search) analysis result. */
export function isPartialResult(r) {
    return isAnalysisResult(r) && r.isDuringSearch === true;
}
/** True if the response is a completed (final) analysis result. */
export function isCompletedResult(r) {
    return isAnalysisResult(r) && r.isDuringSearch === false;
}
/** True if the response carries `noResults: true` (search produced nothing). */
export function hasNoResults(r) {
    if (isAnalysisResult(r) || isActionResponse(r)) {
        return r.noResults === true;
    }
    return false;
}
//# sourceMappingURL=convert.js.map