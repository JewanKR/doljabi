/**
 * Response types for the KataGo Analysis Engine wire protocol.
 *
 * One response is one JSON object, read as a single line from the engine's
 * stdout. Responses carry no single `type` tag — see {@link KataGoResponse}
 * and the type guards in `convert.ts` for how they are discriminated.
 *
 * @module response
 */
import type { Color } from "./common.js";
/** Analysis of the position itself (the root of the search). */
export interface RootInfo {
    /**
     * Win probability in `[0, 1]`. Whose win it measures depends on the engine's
     * `reportAnalysisWinratesAs` setting (default: the side to move).
     */
    winrate: number;
    /** Expected score lead for the current player, in points. */
    scoreLead: number;
    /** Expected mean score difference, in points. */
    scoreMean: number;
    /** Expected score under self-play continuation. */
    scoreSelfplay: number;
    /** Standard deviation of the score estimate. */
    scoreStdev: number;
    /** Combined search utility value. */
    utility: number;
    /** Total visits accumulated at the root. */
    visits: number;
    /** The player to move at this position. */
    currentPlayer: Color;
    /** Hash uniquely identifying this position. */
    thisHash: string;
    /** Symmetry-invariant hash of this position. */
    symHash: string;
    /** Raw neural-net winrate, before search. */
    rawWinrate?: number;
    /** Raw neural-net score lead, before search. */
    rawLead?: number;
    /** Raw neural-net self-play score, before search. */
    rawScoreSelfplay?: number;
    /** Raw neural-net self-play score standard deviation. */
    rawScoreSelfplayStdev?: number;
    /** Raw neural-net no-result probability. */
    rawNoResultProb?: number;
    /** Short-term winrate prediction error estimate. */
    rawStWrError?: number;
    /** Short-term score prediction error estimate. */
    rawStScoreError?: number;
    /** Estimated remaining game length, in moves. */
    rawVarTimeLeft?: number;
}
/** Analysis of one candidate move. */
export interface MoveInfo {
    /** The candidate move, as a GTP location or `"pass"`. */
    move: string;
    /** Visits this move received. */
    visits: number;
    /** Visits the root "wants" to give this move. */
    edgeVisits: number;
    /** Win probability after this move, in `[0, 1]`. */
    winrate: number;
    /** Expected score lead after this move, in points. */
    scoreLead: number;
    /** Expected mean score difference after this move, in points. */
    scoreMean: number;
    /** Expected self-play score after this move. */
    scoreSelfplay: number;
    /** Standard deviation of the score estimate. */
    scoreStdev: number;
    /** Neural-net policy prior for this move, in `[0, 1]`. */
    prior: number;
    /** Combined utility value for this move. */
    utility: number;
    /** Lower-confidence-bound winrate for this move. */
    lcb: number;
    /** Lower-confidence-bound utility for this move. */
    utilityLcb: number;
    /** Rank of this move, `0` being the engine's top choice. */
    order: number;
    /** Total visit weight for this move. */
    weight: number;
    /** Visit weight the root intends for this move. */
    edgeWeight: number;
    /** Internal move-selection value. */
    playSelectionValue: number;
    /** Principal variation: the expected follow-up sequence. */
    pv: string[];
    /** Visit count for each move of `pv`. Present if `includePVVisits` was set. */
    pvVisits?: number[];
    /** Edge-visit count for each move of `pv`. Present if `includePVVisits` was set. */
    pvEdgeVisits?: number[];
    /** Per-point ownership after this move. Present if `includeMovesOwnership` was set. */
    ownership?: number[];
    /** Per-point ownership stdev. Present if `includeMovesOwnershipStdev` was set. */
    ownershipStdev?: number[];
    /** If set, this move's stats were copied from a symmetric equivalent. */
    isSymmetryOf?: string;
    /** No-result probability for this move. */
    noResultValue?: number;
    /** Human-model policy prior for this move, if a human model is loaded. */
    humanPrior?: number;
}
/**
 * A successful analysis result for one turn.
 *
 * `isDuringSearch` is `true` for the interim reports produced by
 * `reportDuringSearchEvery`, and `false` for the final result. The parser in
 * `convert.ts` normalizes a missing value to `false`.
 */
export interface AnalysisResult {
    id: string;
    /** The turn number this result analyzes. */
    turnNumber: number;
    /** `true` if this is a partial (mid-search) report. */
    isDuringSearch: boolean;
    /** Candidate moves, ordered by `order`. */
    moveInfos: MoveInfo[];
    /** Analysis of the position itself. */
    rootInfo: RootInfo;
    /** Whole-board ownership, length `boardXSize * boardYSize`, range `[-1, 1]`. */
    ownership?: number[];
    /** Whole-board ownership stdev, same length as `ownership`. */
    ownershipStdev?: number[];
    /**
     * Neural-net policy, length `boardXSize * boardYSize + 1` (the last entry is
     * the pass move). Illegal moves are reported as `-1`.
     */
    policy?: number[];
    /** Human-model policy, same shape as `policy`, if a human model is loaded. */
    humanPolicy?: number[];
    /** `true` if the search produced no result for this turn. */
    noResults?: boolean;
    /** A non-fatal warning that accompanied this result. */
    warning?: string;
    /** The query field a `warning` refers to, if any. */
    field?: string;
}
/** A fatal error for a query. The query produces no analysis. */
export interface ErrorResponse {
    id: string;
    /** Human-readable error message. */
    error: string;
    /** The offending query field, if the engine could identify one. */
    field?: string;
}
/** A standalone, non-fatal warning (not attached to an analysis result). */
export interface WarningResponse {
    id: string;
    /** Human-readable warning message. */
    warning: string;
    /** The query field the warning refers to, if any. */
    field?: string;
}
/**
 * Acknowledgement of an action query
 * (`terminate` / `terminate_all` / `clear_cache`).
 */
export interface ActionResponse {
    id: string;
    /** The action that was acknowledged. */
    action: "terminate" | "terminate_all" | "clear_cache";
    /** For `terminate`, the `id` of the query that was cancelled. */
    terminateId?: string;
    /** `true` if the cancelled query had not yet produced a result. */
    noResults?: boolean;
}
/** Response to a `query_version` action. */
export interface VersionResponse {
    id: string;
    /** Engine version string, e.g. `"1.15.3"`. */
    version: string;
    /** Git commit hash of the engine build. */
    git_hash: string;
}
/**
 * Every shape readable from the engine's stdout.
 *
 * There is no single `type` tag; responses are discriminated by field
 * presence (the check order matters — see `parseResponse` in `convert.ts`):
 *
 * - `error` present                        -> {@link ErrorResponse}
 * - `action` present                       -> {@link ActionResponse}
 * - `version` present                      -> {@link VersionResponse}
 * - `rootInfo` / `moveInfos` present        -> {@link AnalysisResult}
 * - `warning` present (none of the above)  -> {@link WarningResponse}
 */
export type KataGoResponse = AnalysisResult | ErrorResponse | WarningResponse | ActionResponse | VersionResponse;
//# sourceMappingURL=response.d.ts.map