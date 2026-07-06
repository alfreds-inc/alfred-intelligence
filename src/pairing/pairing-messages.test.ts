// Tests user-facing pairing messages.
import { expectPairingReplyText } from "openclaw/plugin-sdk/channel-test-helpers";
import { describe, expect, it } from "vitest";
import { buildPairingReply } from "./pairing-messages.js";

describe("buildPairingReply", () => {
  const pairingReplyCases = [
    {
      channel: "telegram",
      idLine: "Your Telegram user id: 42",
      code: "QRS678",
    },
    {
      channel: "discord",
      idLine: "Your Discord user id: 1",
      code: "ABC123",
    },
    {
      channel: "slack",
      idLine: "Your Slack user id: U1",
      code: "DEF456",
    },
    {
      channel: "signal",
      idLine: "Your Signal number: +15550001111",
      code: "GHI789",
    },
    {
      channel: "imessage",
      idLine: "Your iMessage sender id: +15550002222",
      code: "JKL012",
    },
    {
      channel: "whatsapp",
      idLine: "Your WhatsApp phone number: +15550003333",
      code: "MNO345",
    },
  ] as const;

  it.each(pairingReplyCases)("formats pairing reply for $channel", (testCase) => {
    const text = buildPairingReply(testCase);
    expectPairingReplyText(text, testCase);
    // The approve command is an operator surface (pairing CLI, channel-setup
    // status); the user-facing reply must end at the code block.
    expect(text).not.toContain("Ask the bot owner to approve with:");
    expect(text.endsWith(`\`\`\`\n${testCase.code}\n\`\`\``)).toBe(true);
  });
});
