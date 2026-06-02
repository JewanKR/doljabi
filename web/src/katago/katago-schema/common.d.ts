/**
 * Shared primitive types for the KataGo Analysis Engine wire protocol.
 *
 * @module common
 */
/** Player color, as used throughout the KataGo protocol. */
export type Color = "B" | "W";
/**
 * A GTP-style board location, e.g. `"Q16"`, `"D4"`, or `"pass"`.
 *
 * Kept as a plain string alias: the protocol does not constrain it further,
 * and board-size-dependent validation is out of scope for compile-time types.
 */
export type Location = string;
/** A `[color, location]` pair — the element type of `moves` / `initialStones`. */
export type GtpMove = [Color, Location];
/**
 * Built-in ruleset names accepted by an analysis query's `rules` field.
 *
 * The trailing `(string & {})` preserves editor autocomplete for the known
 * presets while still permitting any other string, since KataGo's ruleset
 * parser accepts several spellings and aliases.
 */
export type RulesPreset = "tromp-taylor" | "chinese" | "japanese" | "korean" | "aga" | "new-zealand" | "stone-scoring" | (string & {});
/**
 * A custom rules object, accepted by the `rules` field in place of a preset
 * name. All members are optional; the engine fills in defaults.
 *
 * An index signature is included because KataGo's custom-rules schema evolves;
 * the named members exist purely for editor assistance.
 */
export interface CustomRules {
    koRule?: "SIMPLE" | "POSITIONAL" | "SITUATIONAL";
    scoringRule?: "AREA" | "TERRITORY";
    taxRule?: "NONE" | "SEKI" | "ALL";
    multiStoneSuicideLegal?: boolean;
    hasButton?: boolean;
    whiteHandicapBonus?: "0" | "N" | "N-1";
    friendlyPassOk?: boolean;
    [key: string]: unknown;
}
/** The `rules` field of an analysis query: a preset name or a custom object. */
export type Rules = RulesPreset | CustomRules;
/**
 * A per-player move restriction — the element type of `avoidMoves` and
 * `allowMoves` in an analysis query.
 */
export interface PlayerMoveRestriction {
    /** The player the restriction applies to. */
    player: Color;
    /** GTP locations to avoid (for `avoidMoves`) or exclusively allow (`allowMoves`). */
    moves: Location[];
    /** The restriction applies only up to this search depth. */
    untilDepth: number;
}
//# sourceMappingURL=common.d.ts.map