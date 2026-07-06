// Formats pairing challenge replies and setup instructions.
import type { PairingChannel } from "./pairing-store.types.js";

// User-facing pairing reply formatter sent to unapproved channel users. The
// reply deliberately carries no CLI approve command: most operators pair via
// the Alfred wizard, and the terminal hint distracted end users. The approve
// command remains on operator surfaces (pairing CLI, channel-setup status).
// `channel` stays in the contract so plugin call sites are stable.
export function buildPairingReply(params: {
  channel: PairingChannel;
  idLine: string;
  code: string;
}): string {
  const { idLine, code } = params;
  return [
    "Alfred Intelligence: access not configured.",
    "",
    idLine,
    "Pairing code:",
    "```",
    code,
    "```",
  ].join("\n");
}
