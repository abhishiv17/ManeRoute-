// Shared types used by the client, the server routes and the rule engine.

/** Visible length bands, ordered shortest to longest. */
export const LENGTH_BANDS = ["above_ears", "ear_length", "short", "above_chest", "long"] as const;
export type LengthBand = (typeof LENGTH_BANDS)[number];

export const LENGTH_BAND_LABELS: Record<LengthBand, string> = {
  above_ears: "Above the ears",
  ear_length: "Ear length",
  short: "Short (above the shoulders)",
  above_chest: "Medium (around the collarbone)",
  long: "Long (below the chest)",
};

/** Exact strings YouCam Hair Length Detection can return in `results.hair_length.term`. */
export type YouCamLengthTerm =
  | "above the ears"
  | "ear length"
  | "ear length or longer"
  | "short hair"
  | "short hair or longer"
  | "above chest"
  | "above chest or longer"
  | "long hair";

export type HairBaseline = {
  lengthBand: LengthBand;
  /** YouCam only gave a lower bound ("... or longer"): real length may be this band or longer. */
  atLeast: boolean;
  rawProviderValue: string;
  captureQuality: "good" | "needs_retake" | "unknown";
};

/** Texture groups used by the rules, derived from YouCam Hair Type Detection. */
export type TextureGroup = "straight" | "wavy" | "curly" | "coily";

export type HairTexture = {
  group: TextureGroup;
  /** 0 (straight) … 8 (extremely coily): YouCam's nine ordered result ranges. */
  index: number;
  /** YouCam `hair_type.term`, e.g. "Slight to Medium Wavy". */
  term: string;
  /** YouCam `hair_type.mapping`, e.g. "2a to 2b". */
  mapping: string;
};

export type Level = "low" | "medium" | "high";

/** Browsing shelves the user picks. Never inferred from the user's photo. */
export type Collection = "barbershop" | "salon";

export type TargetStyle = {
  id: string;
  name: string;
  description: string;
  /** YouCam v2.1 hair-transfer template id. */
  templateId?: string;
  /** Shelves this cut appears on; unisex cuts appear on both. */
  collections: Collection[];
  /** The shelf this cut is most typical for; preferred for planning stages on that shelf. */
  home: Collection;
  /** Example picture per shelf, each shelf using one consistent example model. */
  thumbs: Partial<Record<Collection, string>>;
  targetLengthBand: LengthBand;
  maintenance: Level;
  commitment: Level;
  textureSensitive: boolean;
  requiresStylistConfirmation: boolean;
  /** Natural texture the preview's finish relies on ("any" when texture barely matters). */
  textureNeed: "any" | TextureGroup;
  /** Things the YouCam template does beyond the cut, shown before the user picks it. */
  sideEffects: string[];
  routeHints: string[];
  /** Ask YouCam to keep the user's own hair colour (only for templates that support it). */
  keepUserColor?: boolean;
  /** The look may involve a perm or other chemical treatment. */
  mayNeedChemical?: boolean;
};

export type Preferences = {
  growOut: "yes" | "maybe" | "no";
  keepLength: boolean;
  chemical: "yes" | "no" | "unsure";
  maintenance: Level;
  nonNegotiables: string;
};

export type RouteKind =
  | "can_discuss_now"
  | "length_building"
  | "cut_first"
  | "stylist_confirmation_needed"
  | "retake_required";

export type RuleHit = {
  /** Stable rule id, shown in the "why" panel so the logic is inspectable. */
  rule: string;
  text: string;
};

/** YouCam Hair Extension length to preview "your own cut, grown out". */
export type GrowOutLength = "chest" | "long";

export type TransitionRoute = {
  route: RouteKind;
  headline: string;
  explanation: string;
  reasons: RuleHit[];
  cautions: RuleHit[];
  /** Catalog ids of along-the-way cuts to preview, in order from now to the target (0–2). */
  stageStyleIds: string[];
  /** When set, preview the user's own cut grown out to this length (Hair Extension VTO). */
  growOut?: GrowOutLength;
  /** True when a grow-out preview would fit the route but the hair is too short to extend yet. */
  growOutSkipped?: boolean;
  questions: string[];
  limitations: string[];
};

export type RouteOptions = {
  /** Shelf the user browsed; the planning stage stays on it. */
  collection: Collection | "all";
  /** From YouCam Hair Type Detection, when the user did the texture scan. */
  texture?: HairTexture | null;
};

/** What the client gets back when polling a task through our server. */
export type TaskPoll<T> =
  | { status: "running" }
  | { status: "success"; result: T }
  | { status: "error"; code: string; message: string; retake: boolean };
