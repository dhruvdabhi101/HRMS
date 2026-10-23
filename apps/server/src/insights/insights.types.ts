export interface PayGroupRow {
	d1: string;
	d2: string | null;
	headcount: bigint;
	value: bigint;
}

export interface DistributionSummaryRow {
	headcount: bigint;
	min: number;
	q1: number;
	median: number;
	q3: number;
	max: number;
	average: number;
	lowerFence: number;
	upperFence: number;
	lowerWhisker: number;
	upperWhisker: number;
	outlierCount: bigint;
}
export interface PayOutlierRow {
	id: string;
	name: string;
	annualBaseUsd: bigint;
}
export interface EmployeePositionRow extends PayOutlierRow {
	status: "active" | "terminated";
	includedInCohort: bigint;
	isOutlier: bigint | null;
}
