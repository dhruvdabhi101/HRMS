import { calculateCompensation, convertToUsdMinor } from "../../src/compensation/compensation.utils";

describe("compensation calculations", () => {
	it("calculates local bonus and USD values using the fixed INR rate", () => {
		expect(calculateCompensation(100_000_000, 1_000, 12_000)).toEqual({
			bonusMinor: 10_000_000,
			targetMinor: 110_000_000,
			baseUsdMinor: 1_200_000,
			targetUsdMinor: 1_320_000,
		});
	});

	it("rounds a half-cent local bonus up before adding it to base", () => {
		expect(calculateCompensation(10_005, 1_000, 1_000_000)).toEqual({
			bonusMinor: 1_001,
			targetMinor: 11_006,
			baseUsdMinor: 10_005,
			targetUsdMinor: 11_006,
		});
	});

	it.each([
		[10_025, 740_000, 7_419],
		[1, 12_000, 0],
		[49, 12_000, 1],
		[1, 499_999, 0],
		[1, 500_000, 1],
	])("converts %i minor units at rate %i to %i USD cents", (amount, rate, expected) => {
		expect(convertToUsdMinor(amount, rate)).toBe(expected);
	});

	it("supports zero and maximum bonus targets and the largest permitted base", () => {
		expect(calculateCompensation(1, 0, 1_000_000).bonusMinor).toBe(0);
		expect(calculateCompensation(1_000_000_000, 10_000, 1_250_000)).toEqual({
			bonusMinor: 1_000_000_000,
			targetMinor: 2_000_000_000,
			baseUsdMinor: 1_250_000_000,
			targetUsdMinor: 2_500_000_000,
		});
	});

	it.each([0, -1, 1.5, 1_000_000_001, NaN, Infinity])("rejects invalid base %s without rounding it", (base) => {
		expect(() => calculateCompensation(base, 0, 1_000_000)).toThrow(RangeError);
	});

	it.each([-1, 10_001, 1.5, NaN, Infinity])("rejects invalid bonus basis points %s", (bonus) => {
		expect(() => calculateCompensation(10_000, bonus, 1_000_000)).toThrow(RangeError);
	});

	it.each([0, -1, 1.5, NaN, Infinity])("rejects invalid FX rate %s", (rate) => {
		expect(() => convertToUsdMinor(10_000, rate)).toThrow(RangeError);
	});

	it("does not lose cents when an intermediate FX product exceeds number precision", () => {
		expect(convertToUsdMinor(Number.MAX_SAFE_INTEGER, 1_000_000)).toBe(Number.MAX_SAFE_INTEGER);
		expect(() => convertToUsdMinor(Number.MAX_SAFE_INTEGER, 1_000_001)).toThrow(RangeError);
	});

	it.each([-1, 1.5, NaN])("rejects invalid local minor units %s", (amount) => {
		expect(() => convertToUsdMinor(amount, 1_000_000)).toThrow(RangeError);
	});
});
