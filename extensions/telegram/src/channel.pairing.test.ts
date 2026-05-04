import { PAIRING_APPROVED_MESSAGE } from "openclaw/plugin-sdk/channel-status";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { telegramPlugin } from "./channel.js";
import { clearTelegramRuntime, setTelegramRuntime } from "./runtime.js";
import type { TelegramRuntime } from "./runtime.types.js";

afterEach(() => {
  clearTelegramRuntime();
});

describe("telegramPlugin pairing", () => {
  it("sends the approval greeting through the paired account", async () => {
    const sendMessageTelegram = vi.fn(async () => ({ chatId: "123", messageId: "456" }));
    setTelegramRuntime({
      channel: {
        telegram: {
          sendMessageTelegram,
        },
      },
    } as unknown as TelegramRuntime);
    const cfg = {
      channels: {
        telegram: {
          accounts: {
            ops: {
              botToken: "123456:telegram-token",
            },
          },
        },
      },
    } as OpenClawConfig;

    await telegramPlugin.pairing?.notifyApproval?.({
      cfg,
      id: "777",
      accountId: "ops",
    });

    expect(sendMessageTelegram).toHaveBeenCalledWith("777", PAIRING_APPROVED_MESSAGE, {
      cfg,
      token: "123456:telegram-token",
      accountId: "ops",
    });
    expect(PAIRING_APPROVED_MESSAGE).toContain("let's get to work");
  });
});
