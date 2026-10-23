function requireInteger(value: number, minimum: number, maximum: number) {
	if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
		throw new RangeError(
			`Expected an integer between ${minimum} and ${maximum}`,
		);
	}
}

function roundRatio(amount: number, multiplier: number, divisor: number) {
	const result = Number(
		(BigInt(amount) * BigInt(multiplier) + BigInt(divisor / 2)) /
			BigInt(divisor),
	);
	if (!Number.isSafeInteger(result)) {
		throw new RangeError("Calculated amount exceeds safe integer precision");
	}
	return result;
}

export function convertToUsdMinor(localMinor: number, usdRateMicros: number) {
	requireInteger(localMinor, 0, Number.MAX_SAFE_INTEGER);
	requireInteger(usdRateMicros, 1, Number.MAX_SAFE_INTEGER);
	return roundRatio(localMinor, usdRateMicros, 1_000_000);
}

export function calculateCompensation(
	annualBaseMinor: number,
	bonusTargetBps: number,
	usdRateMicros: number,
) {
	requireInteger(annualBaseMinor, 1, 1_000_000_000);
	requireInteger(bonusTargetBps, 0, 10_000);
	const bonusMinor = roundRatio(annualBaseMinor, bonusTargetBps, 10_000);
	const targetMinor = annualBaseMinor + bonusMinor;
	return {
		bonusMinor,
		targetMinor,
		baseUsdMinor: convertToUsdMinor(annualBaseMinor, usdRateMicros),
		targetUsdMinor: convertToUsdMinor(targetMinor, usdRateMicros),
	};
}
