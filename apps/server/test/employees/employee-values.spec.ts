import { decimalToHundredths, isValidHireDate } from "@repo/shared";

describe("employee input values", () => {
	it.each([["0.29", 29], ["100.05", 10_005], ["10", 1_000], ["0", 0], ["10000000.00", 1_000_000_000]])("converts %s exactly to integer hundredths", (input, expected) => {
		expect(decimalToHundredths(input)).toBe(expected);
	});
	it.each(["1.001", "1e3", "-1", "Infinity", "", "1,000", "9007199254740992"])("rejects %s rather than rounding or coercing it", (input) => {
		expect(() => decimalToHundredths(input)).toThrow(RangeError);
	});
	it("validates real date-only values against today's UTC date", () => {
		const clock = vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-01-01T23:59:59Z"));
		try {
			expect(isValidHireDate("2026-01-01")).toBe(true);
			expect(isValidHireDate("2026-01-02")).toBe(false);
			expect(isValidHireDate("2024-02-29")).toBe(true);
			expect(isValidHireDate("2025-02-29")).toBe(false);
			expect(isValidHireDate("2026-01-01T00:00:00Z")).toBe(false);
		} finally { clock.mockRestore(); }
	});
});
