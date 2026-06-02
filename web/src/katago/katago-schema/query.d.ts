/**
 * Request (query) types for the KataGo Analysis Engine wire protocol.
 *
 * One query is one JSON object, written as a single line to the engine's
 * stdin. See `convert.ts` for serialization.
 *
 * @module query
 */
import type { Color, GtpMove, Rules, PlayerMoveRestriction } from "./common.js";
/**
 * A position-analysis query.
 *
 * Only `id` is required; every other field has an engine-side default and may
 * be omitted. Field names match the wire protocol exactly.
 */
export interface AnalysisQuery {
    /** Unique query identifier. Echoed back on every response for this query. */
    id: string;
    /** Moves played from the initial position, as `[color, location]` pairs. */
    moves?: GtpMove[];
    /** Stones placed before any moves (e.g. handicap), as `[color, location]` pairs. */
    initialStones?: GtpMove[];
    /** Player to move at the start of `moves`. Defaults based on the position. */
    initialPlayer?: Color;
    /** Ruleset: a preset name or a custom rules object. */
    rules?: Rules;
    /** Komi. Should be a multiple of 0.5. */
    komi?: number;
    /** Board width. Defaults to 19. */
    boardXSize?: number;
    /** Board height. Defaults to 19. */
    boardYSize?: number;
    /**
     * Turn numbers to analyze (`0` is the empty board before any move).
     * Defaults to analyzing only the last turn.
     */
    analyzeTurns?: number[];
    /** Maximum number of root visits for the search. */
    maxVisits?: number;
    /** Root policy temperature; values greater than 1 widen the search. */
    rootPolicyTemperature?: number;
    /** Root FPU reduction; affects willingness to explore unvisited moves. */
    rootFpuReductionMax?: number;
    /** Maximum length of the principal variation reported in each `MoveInfo`. */
    analysisPVLen?: number;
    /** Include whole-board ownership in the result. */
    includeOwnership?: boolean;
    /** Include per-point ownership standard deviation. Requires `includeOwnership`. */
    includeOwnershipStdev?: boolean;
    /** Include per-move ownership in each `MoveInfo`. */
    includeMovesOwnership?: boolean;
    /** Include per-move ownership standard deviation. Requires `includeMovesOwnership`. */
    includeMovesOwnershipStdev?: boolean;
    /** Include the raw neural-net policy distribution in the result. */
    includePolicy?: boolean;
    /** Include per-PV-move visit counts in each `MoveInfo`. */
    includePVVisits?: boolean;
    /** Moves each player should avoid, up to a given search depth. */
    avoidMoves?: PlayerMoveRestriction[];
    /** Moves each player is exclusively allowed, up to a given search depth. */
    allowMoves?: PlayerMoveRestriction[];
    /** Arbitrary engine configuration overrides applied to this query. */
    overrideSettings?: Record<string, unknown>;
    /** Scheduling priority relative to other queries (higher runs sooner). */
    priority?: number;
    /** Per-turn priorities, parallel to `analyzeTurns`. */
    priorities?: number[];
    /** If set, emit partial results roughly every this many seconds. */
    reportDuringSearchEvery?: number;
    /** How handicap stones affect white's komi compensation. */
    whiteHandicapBonus?: "0" | "N" | "N-1";
}
/** Cancels a single in-flight query by id. */
export interface TerminateQuery {
    id: string;
    action: "terminate";
    /** The `id` of the query to cancel. */
    terminateId: string;
}
/** Cancels all in-flight queries, optionally limited to specific turns. */
export interface TerminateAllQuery {
    id: string;
    action: "terminate_all";
    /** If given, only queries analyzing these turn numbers are cancelled. */
    turnNumbers?: number[];
}
/** Asks the engine to report its version. */
export interface QueryVersionQuery {
    id: string;
    action: "query_version";
}
/** Asks the engine to clear its neural-net evaluation cache. */
export interface ClearCacheQuery {
    id: string;
    action: "clear_cache";
}
/** Any non-analysis "action" query. Discriminated by the `action` field. */
export type ActionQuery = TerminateQuery | TerminateAllQuery | QueryVersionQuery | ClearCacheQuery;
/** Anything writable to the engine's stdin. */
export type AnyQuery = AnalysisQuery | ActionQuery;
//# sourceMappingURL=query.d.ts.map