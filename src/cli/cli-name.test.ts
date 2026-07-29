// Tests Zolven Intelligence CLI-name resolution and upstream command rewriting.
import { describe, expect, it } from "vitest";
import { replaceCliName, resolveCliName } from "./cli-name.js";

describe("resolveCliName", () => {
  it("defaults to the Zolven Intelligence binary", () => {
    expect(resolveCliName([])).toBe("zolven-intelligence");
    expect(resolveCliName(["node", "/opt/bin/not-a-zolven-entrypoint"])).toBe(
      "zolven-intelligence",
    );
  });

  it("preserves recognized Zolven Intelligence and upstream entrypoints", () => {
    expect(resolveCliName(["node", "/opt/bin/zolven-intelligence"])).toBe("zolven-intelligence");
    expect(resolveCliName(["node", "/opt/bin/openclaw"])).toBe("openclaw");
  });
});

describe("replaceCliName", () => {
  it("rewrites upstream and Zolven Intelligence command prefixes", () => {
    expect(replaceCliName("openclaw doctor", "zolven-intelligence")).toBe(
      "zolven-intelligence doctor",
    );
    expect(replaceCliName("pnpm zolven-intelligence skills check", "openclaw")).toBe(
      "pnpm openclaw skills check",
    );
  });
});
