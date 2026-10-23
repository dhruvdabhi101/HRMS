export function formatEmployeeMoney(minor: number, currency: string) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		currencyDisplay: "code",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(minor / 100);
}

export function formatEmployeeDate(date: string) {
	return new Intl.DateTimeFormat("en-GB", {
		dateStyle: "medium",
		timeZone: "UTC",
	}).format(new Date(date));
}

export function formatEmployeeTimestamp(date: string) {
	return new Intl.DateTimeFormat("en-GB", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "UTC",
	}).format(new Date(date));
}
