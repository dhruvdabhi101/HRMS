export function isValidHireDate(value: unknown): value is string {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
		return false;
	const parsed = new Date(`${value}T00:00:00.000Z`);
	return (
		Number.isFinite(parsed.getTime()) &&
		parsed.toISOString().slice(0, 10) === value &&
		value <= new Date(Date.now()).toISOString().slice(0, 10)
	);
}

export function decimalToHundredths(value: string): number {
	if (!/^\d+(\.\d{1,2})?$/.test(value))
		throw new RangeError("Use a number with at most two decimal places");
	const [whole, fraction = ""] = value.split(".");
	const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
	if (!Number.isSafeInteger(result))
		throw new RangeError("Amount is too large");
	return result;
}
