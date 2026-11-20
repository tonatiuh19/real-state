import { describe, expect, it } from "vitest";
import { extractEntryScript, isNewBuildAvailable } from "./buildVersion";

describe("buildVersion", () => {
  it("extracts the hashed entry script", () => {
    const html = `<head><script type="module" crossorigin src="/assets/index-BgoTtp0V.js"></script>
      <link rel="modulepreload" href="/assets/vendor-x1.js"></head>`;
    expect(extractEntryScript(html)).toBe("/assets/index-BgoTtp0V.js");
    expect(extractEntryScript(`<script src="https://cdn.x/assets/index-Ab1.js"></script>`)).toBe("/assets/index-Ab1.js");
    expect(extractEntryScript("<html></html>")).toBeNull();
  });
  it("only flags a real difference", () => {
    expect(isNewBuildAvailable("/assets/index-a.js", "/assets/index-b.js")).toBe(true);
    expect(isNewBuildAvailable("/assets/index-a.js", "/assets/index-a.js")).toBe(false);
    expect(isNewBuildAvailable(null, "/assets/index-b.js")).toBe(false);
    expect(isNewBuildAvailable("/assets/index-a.js", null)).toBe(false);
  });
});
