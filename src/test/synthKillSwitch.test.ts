import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";

// Phase 10 kill switch: no un-annotated Math.random or hard-coded synth
// strings may live in gated hub directories.
describe("Phase 10 synth kill-switch", () => {
  it("scripts/check-synth.sh passes", () => {
    expect(() =>
      execSync("bash scripts/check-synth.sh", { stdio: "pipe" }),
    ).not.toThrow();
  });
});
