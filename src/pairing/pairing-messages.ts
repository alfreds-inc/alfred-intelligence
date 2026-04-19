import type { PairingChannel } from "./pairing-store.types.js";

export function buildPairingReply(params: {
  channel: PairingChannel;
  idLine: string;
  code: string;
}): string {
  return [
    "Hello, Alfred here 👋🏼",
    "",
    params.idLine,
    "",
    "Pairing code:",
    "```",
    params.code,
    "```",
  ].join("\n");
}
