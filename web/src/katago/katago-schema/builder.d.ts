/**
 * Convenience builders for constructing well-formed queries.
 *
 * @module builder
 */
import type { AnalysisQuery, TerminateQuery, TerminateAllQuery, QueryVersionQuery, ClearCacheQuery } from "./query.js";
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
export declare function createIdGenerator(prefix?: string): () => string;
/**
 * Build an {@link AnalysisQuery}, filling in common defaults (19x19 board,
 * Japanese rules, 6.5 komi).
 *
 * The caller must supply `id`; every default is overridable through `params`.
 * `maxVisits` is intentionally left unset so the engine's configured default
 * applies.
 */
export declare function createAnalysisQuery(params: Partial<AnalysisQuery> & {
    id: string;
}): AnalysisQuery;
/** Build a query that cancels a single in-flight query by id. */
export declare function terminateQuery(id: string, terminateId: string): TerminateQuery;
/** Build a query that cancels all in-flight queries, optionally limited to turns. */
export declare function terminateAllQuery(id: string, turnNumbers?: number[]): TerminateAllQuery;
/** Build a query that asks the engine to report its version. */
export declare function queryVersionQuery(id: string): QueryVersionQuery;
/** Build a query that asks the engine to clear its neural-net cache. */
export declare function clearCacheQuery(id: string): ClearCacheQuery;
//# sourceMappingURL=builder.d.ts.map