import type { TargetStyle } from "./types";

// Plain-language notes shown under "About this look", derived from the style's flags
// so every catalog entry explains itself consistently.
export function routeHintsFor(s: Omit<TargetStyle, "routeHints">): string[] {
  const h: string[] = [];
  if (s.targetLengthBand === "above_ears") h.push("Very short cuts need regular trims to keep their shape; ask how often.");
  if (s.textureSensitive) h.push("How this sits depends on your natural texture; ask how it will look without heavy styling.");
  if (s.requiresStylistConfirmation) h.push("The shape depends on cutting technique (fringe, layers or disconnection); let the stylist check it on your hair.");
  if (s.mayNeedChemical) h.push("The curl or wave may come from natural texture, daily styling or a perm; confirm which with the stylist.");
  if (s.maintenance === "high") h.push("Expect daily styling to get the look in the preview.");
  if (!s.keepUserColor) h.push("This YouCam template also changes hair colour in the preview; focus on the shape.");
  if (s.targetLengthBand === "long") h.push("Keep trims small and focused on the ends while building length.");
  return h;
}
