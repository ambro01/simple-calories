/**
 * Unit tests for date-formatter.ts
 *
 * Testing date formatting utilities:
 * - YYYY-MM-DD format (API)
 * - Full format (Polish locale)
 * - Short format (Polish locale)
 * - Time format
 * - Date parsing and conversion
 */

import { createDateFormatter } from "../date-formatter";

describe("DateFormatter", () => {
  let formatter: ReturnType<typeof createDateFormatter>;

  beforeEach(() => {
    formatter = createDateFormatter();
  });

  describe("format - YYYY-MM-DD", () => {
    it("formats date to YYYY-MM-DD", () => {
      const date = new Date("2025-01-27T10:30:00Z");
      const result = formatter.format(date, "YYYY-MM-DD");
      expect(result).toBe("2025-01-27");
    });

    it("accepts string dates", () => {
      const result = formatter.format("2025-01-27", "YYYY-MM-DD");
      expect(result).toBe("2025-01-27");
    });

    it("handles single-digit months with leading zero", () => {
      const date = new Date("2025-01-05T12:00:00Z");
      expect(formatter.format(date, "YYYY-MM-DD")).toBe("2025-01-05");
    });

    it("handles single-digit days with leading zero", () => {
      const date = new Date("2025-11-05T12:00:00Z");
      expect(formatter.format(date, "YYYY-MM-DD")).toBe("2025-11-05");
    });

    it("handles end of year correctly", () => {
      const date = new Date("2025-12-31T12:00:00Z");
      expect(formatter.format(date, "YYYY-MM-DD")).toBe("2025-12-31");
    });

    it("handles beginning of year correctly", () => {
      const date = new Date("2025-01-01T12:00:00Z");
      expect(formatter.format(date, "YYYY-MM-DD")).toBe("2025-01-01");
    });

    it("handles leap year dates", () => {
      const leapDay = new Date("2024-02-29T12:00:00Z");
      expect(formatter.format(leapDay, "YYYY-MM-DD")).toBe("2024-02-29");
    });
  });

  describe("format - full (Polish locale)", () => {
    it("formats date to full format in Polish", () => {
      const date = new Date("2025-10-30T10:30:00Z");
      const result = formatter.format(date, "full");
      // The exact format depends on locale, but should contain key elements
      expect(result).toMatch(/30/);
      expect(result).toMatch(/2025/);
    });

    it("returns format with year", () => {
      const date = new Date("2025-01-27T12:00:00Z");
      const result = formatter.format(date, "full");
      expect(result).toContain("2025");
      expect(result).toContain("27");
    });

    it("returns long format (more than 15 characters)", () => {
      const date = new Date("2025-01-27T12:00:00Z");
      const result = formatter.format(date, "full");
      expect(result.length).toBeGreaterThan(15);
    });
  });

  describe("format - short (Polish locale)", () => {
    it("formats date to short format in Polish", () => {
      const date = new Date("2025-10-30T10:30:00Z");
      const result = formatter.format(date, "short");
      expect(result).toMatch(/30/);
    });

    it("does not include year in short format", () => {
      const date = new Date("2025-10-30T12:00:00Z");
      const result = formatter.format(date, "short");
      expect(result).not.toContain("2025");
    });

    it("is shorter than full format", () => {
      const date = new Date("2025-01-27T12:00:00Z");
      const shortResult = formatter.format(date, "short");
      const fullResult = formatter.format(date, "full");
      expect(shortResult.length).toBeLessThan(fullResult.length);
    });
  });

  describe("format - time", () => {
    it("formats date to time format", () => {
      const date = new Date("2025-01-27T08:30:00Z");
      const result = formatter.format(date, "time");
      // Time format depends on timezone
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it("returns time in HH:MM format", () => {
      const date = new Date("2025-01-27T12:30:00Z");
      const result = formatter.format(date, "time");
      const parts = result.split(":");
      expect(parts).toHaveLength(2);
      expect(parts[0]).toMatch(/^\d{2}$/);
      expect(parts[1]).toMatch(/^\d{2}$/);
    });

    it("does not include seconds", () => {
      const date = new Date("2025-01-27T12:30:45Z");
      const result = formatter.format(date, "time");
      expect(result).not.toContain("45");
      expect(result.split(":")).toHaveLength(2);
    });
  });

  describe("parseAPIDate", () => {
    it("parses API date string to Date object", () => {
      const result = formatter.parseAPIDate("2025-01-27");
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January is 0
      expect(result.getDate()).toBe(27);
    });

    it("parses ISO string with time", () => {
      const result = formatter.parseAPIDate("2025-01-27T12:30:00Z");
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
    });

    it("handles different date formats", () => {
      const result = formatter.parseAPIDate("2025-12-31");
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(11); // December is 11
      expect(result.getDate()).toBe(31);
    });

    it("returns valid Date object for valid input", () => {
      const result = formatter.parseAPIDate("2025-01-27");
      expect(result.toString()).not.toBe("Invalid Date");
    });
  });

  describe("toAPIFormat", () => {
    it("converts Date to API format string", () => {
      const date = new Date("2025-01-27T10:30:00Z");
      const result = formatter.toAPIFormat(date);
      expect(result).toBe("2025-01-27");
    });

    it("handles different times correctly", () => {
      const date = new Date("2025-12-31T23:59:59Z");
      const result = formatter.toAPIFormat(date);
      expect(result).toBe("2025-12-31");
    });

    it("includes leading zeros for single-digit months", () => {
      const date = new Date("2025-01-05T12:00:00Z");
      expect(formatter.toAPIFormat(date)).toBe("2025-01-05");
    });

    it("includes leading zeros for single-digit days", () => {
      const date = new Date("2025-11-05T12:00:00Z");
      expect(formatter.toAPIFormat(date)).toBe("2025-11-05");
    });

    it("handles beginning of year", () => {
      const date = new Date("2025-01-01T00:00:00Z");
      expect(formatter.toAPIFormat(date)).toBe("2025-01-01");
    });
  });

  describe("round-trip conversion", () => {
    it("parseAPIDate and toAPIFormat are inverse operations", () => {
      const originalDate = "2025-01-27";
      const parsed = formatter.parseAPIDate(originalDate);
      const formatted = formatter.toAPIFormat(parsed);
      expect(formatted).toBe(originalDate);
    });

    it("maintains date integrity across conversions", () => {
      const dates = [
        "2025-01-01",
        "2025-06-15",
        "2025-12-31",
        "2024-02-29", // leap year
      ];

      dates.forEach((dateStr) => {
        const parsed = formatter.parseAPIDate(dateStr);
        const formatted = formatter.toAPIFormat(parsed);
        expect(formatted).toBe(dateStr);
      });
    });

    it("format YYYY-MM-DD produces same result as toAPIFormat", () => {
      const date = new Date("2025-01-27T12:00:00Z");
      expect(formatter.format(date, "YYYY-MM-DD")).toBe(formatter.toAPIFormat(date));
    });
  });

  describe("edge cases", () => {
    it("accepts both string and Date inputs for format", () => {
      const dateStr = "2025-01-27T12:00:00Z";
      const dateObj = new Date(dateStr);

      expect(formatter.format(dateStr, "YYYY-MM-DD")).toBe(formatter.format(dateObj, "YYYY-MM-DD"));
    });

    it("handles ISO string with milliseconds", () => {
      const date = "2025-01-27T12:30:45.123Z";
      expect(formatter.format(date, "YYYY-MM-DD")).toBe("2025-01-27");
    });

    it("handles dates at timezone boundaries", () => {
      const date = new Date("2025-01-27T00:00:00Z");
      expect(formatter.format(date, "YYYY-MM-DD")).toBe("2025-01-27");
    });
  });

  describe("multiple formatter instances", () => {
    it("creates independent formatter instances", () => {
      const formatter1 = createDateFormatter();
      const formatter2 = createDateFormatter();

      expect(formatter1).not.toBe(formatter2);
      expect(formatter1.format).toBeInstanceOf(Function);
      expect(formatter2.format).toBeInstanceOf(Function);
    });

    it("formatters produce consistent results", () => {
      const formatter1 = createDateFormatter();
      const formatter2 = createDateFormatter();
      const date = "2025-01-27T12:00:00Z";

      expect(formatter1.format(date, "YYYY-MM-DD")).toBe(formatter2.format(date, "YYYY-MM-DD"));
    });
  });
});
