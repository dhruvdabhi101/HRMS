import { describe, expect, it } from "vitest";
import { describeMedianPosition } from "../insights.utils";

describe("employee salary position wording", () => {
	it.each([
		[10_001, 10_000, "Less than 1% above the median"],
		[9_999, 10_000, "Less than 1% below the median"],
		[10_000, 10_000, "At the median"],
		[12_000, 10_000, "20% above the median"],
		[0, 0, "At the median"],
		[1, 0, "Above the median"],
	])("describes salary %s versus median %s without claiming unequal pay is equal", (salary, median, description) => {
		expect(describeMedianPosition(salary, median)).toBe(description);
	});
});
