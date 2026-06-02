/**
 * Convenience builders for constructing well-formed queries.
 *
 * @module builder
 */
/**
 * Create a generator of unique, monotonically increasing query ids.
 *
 * The default prefix `"QUERY:"` mirrors the scheme KaTrain uses.
 *
 * @example
 * const nextId = createIdGenerator();
 * nextId(); // "QUERY:1"
 * nextId(); // "QUERY:2"
 */
export function createIdGenerator(prefix = "QUERY:") {
    let counter = 0;
    return () => `${prefix}${++counter}`;
}
/** Defaults applied by {@link createAnalysisQuery} when a field is omitted. */
const ANALYSIS_QUERY_DEFAULTS = {
    boardXSize: 19,
    boardYSize: 19,
    rules: "japanese",
    komi: 6.5,
};
/**
 * Build an {@link AnalysisQuery}, filling in common defaults (19x19 board,
 * Japanese rules, 6.5 komi).
 *
 * The caller must supply `id`; every default is overridable through `params`.
 * `maxVisits` is intentionally left unset so the engine's configured default
 * applies.
 */
export function createAnalysisQuery(params) {
    return { ...ANALYSIS_QUERY_DEFAULTS, ...params };
}
/** Build a query that cancels a single in-flight query by id. */
export function terminateQuery(id, terminateId) {
    return { id, action: "terminate", terminateId };
}
/** Build a query that cancels all in-flight queries, optionally limited to turns. */
export function terminateAllQuery(id, turnNumbers) {
    return turnNumbers === undefined
        ? { id, action: "terminate_all" }
        : { id, action: "terminate_all", turnNumbers };
}
/** Build a query that asks the engine to report its version. */
export function queryVersionQuery(id) {
    return { id, action: "query_version" };
}
/** Build a query that asks the engine to clear its neural-net cache. */
export function clearCacheQuery(id) {
    return { id, action: "clear_cache" };
}
//# sourceMappingURL=builder.js.map