/**
 * Shared assertions for channel pairing reply text.
 */
import { expect } from "vitest";

/** Extracts and asserts the pairing code block from a pairing reply. */
export function extractPairingCode(text: string): string {
  const code = text.match(/Pairing code:\s*```[\r\n]+([A-Z2-9]{6,})/)?.[1];
  expect(code).toBeDefined();
  return code ?? "";
}

/**
 * Verifies the visible pairing reply contains the expected id and code, and
 * carries no CLI approve hint (that command is an operator surface only).
 */
export function expectPairingReplyText(
  text: string,
  params: {
    channel: string;
    idLine: string;
    code?: string;
  },
): string {
  const code = params.code ?? extractPairingCode(text);
  expect(text).toContain("Alfred Intelligence: access not configured.");
  expect(text).toContain(params.idLine);
  expect(text).toContain("Pairing code:");
  expect(text).toContain(`\n\`\`\`\n${code}\n\`\`\``);
  expect(text).not.toContain("pairing approve");
  return code;
}
