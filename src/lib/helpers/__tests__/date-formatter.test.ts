import { createDateFormatter } from '../date-formatter';

describe('DateFormatter', () => {
  let formatter: ReturnType<typeof createDateFormatter>;

  beforeEach(() => {
    formatter = createDateFormatter();
  });

  describe('format', () => {
    it('formats date to YYYY-MM-DD', () => {
      const date = new Date('2025-01-27T10:30:00Z');
      const result = formatter.format(date, 'YYYY-MM-DD');
      expect(result).toBe('2025-01-27');
    });

    it('formats date to full format in Polish', () => {
      const date = new Date('2025-10-30T10:30:00Z');
      const result = formatter.format(date, 'full');
      // The exact format depends on locale, but should contain key elements
      expect(result).toMatch(/30/);
      expect(result).toMatch(/2025/);
    });

    it('formats date to short format in Polish', () => {
      const date = new Date('2025-10-30T10:30:00Z');
      const result = formatter.format(date, 'short');
      expect(result).toMatch(/30/);
    });

    it('formats date to time format', () => {
      const date = new Date('2025-01-27T08:30:00Z');
      const result = formatter.format(date, 'time');
      // Time format depends on timezone
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('accepts string dates', () => {
      const result = formatter.format('2025-01-27', 'YYYY-MM-DD');
      expect(result).toBe('2025-01-27');
    });
  });

  describe('parseAPIDate', () => {
    it('parses API date string to Date object', () => {
      const result = formatter.parseAPIDate('2025-01-27');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January is 0
      expect(result.getDate()).toBe(27);
    });
  });

  describe('toAPIFormat', () => {
    it('converts Date to API format string', () => {
      const date = new Date('2025-01-27T10:30:00Z');
      const result = formatter.toAPIFormat(date);
      expect(result).toBe('2025-01-27');
    });

    it('handles different times correctly', () => {
      const date = new Date('2025-12-31T23:59:59Z');
      const result = formatter.toAPIFormat(date);
      expect(result).toBe('2025-12-31');
    });
  });
});
