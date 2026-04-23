import { describe, expect, it } from "vitest";

import { mergeSx } from "@/components/ui/merge-sx";

describe("mergeSx", () => {
  it("preserves caller sx arrays without nesting them", () => {
    const merged = mergeSx(
      [
        {
          maxWidth: 480,
        },
      ],
      [
        {
          p: 3,
        },
        {
          mx: "auto",
        },
      ],
    );

    expect(merged).toEqual([
      {
        maxWidth: 480,
      },
      {
        p: 3,
      },
      {
        mx: "auto",
      },
    ]);
  });

  it("appends singular sx objects after the base styles", () => {
    const merged = mergeSx(
      [
        {
          width: "100%",
        },
      ],
      {
        maxWidth: 560,
      },
    );

    expect(merged).toEqual([
      {
        width: "100%",
      },
      {
        maxWidth: 560,
      },
    ]);
  });
});
