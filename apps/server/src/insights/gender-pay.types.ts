import type { GenderPayGroup } from "@repo/shared";

export interface GenderPayRow {
	level: GenderPayGroup["level"];
	gender: GenderPayGroup["genders"][number]["gender"];
	headcount: bigint;
	median: number;
	gapPercent: number | null;
	smallSample: bigint;
}
