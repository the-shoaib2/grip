import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { applyPatch } from "./patch-engine.js";

describe("Patch Engine", () => {
  const tempFile = path.join(__dirname, "temp-test-file.txt");

  beforeEach(() => {
    fs.writeFileSync(
      tempFile,
      "line one\nline two\nline three\nline four\nline five",
      "utf-8"
    );
  });

  afterEach(() => {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  });

  it("should replace a single line correctly", async () => {
    await applyPatch({
      filePath: tempFile,
      startLine: 3,
      endLine: 3,
      replacementCode: "line three modified",
    });

    const content = fs.readFileSync(tempFile, "utf-8");
    expect(content).toBe("line one\nline two\nline three modified\nline four\nline five");
  });

  it("should replace a range of lines correctly", async () => {
    await applyPatch({
      filePath: tempFile,
      startLine: 2,
      endLine: 4,
      replacementCode: "replaced range",
    });

    const content = fs.readFileSync(tempFile, "utf-8");
    expect(content).toBe("line one\nreplaced range\nline five");
  });

  it("should throw error for invalid ranges", async () => {
    await expect(
      applyPatch({
        filePath: tempFile,
        startLine: 0,
        endLine: 3,
        replacementCode: "error",
      })
    ).rejects.toThrow();
  });
});
