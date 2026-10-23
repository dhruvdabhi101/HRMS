export const PAY_DIMENSIONS = [
	"country",
	"department",
	"level",
	"title",
] as const;
export const PAY_METRICS = [
	"headcount",
	"min",
	"median",
	"average",
	"max",
	"totalTarget",
] as const;
export const PAY_DIMENSION_LABELS = {
	country: "Country",
	department: "Department",
	level: "Level",
	title: "Job title",
} as const;
export const PAY_METRIC_LABELS = {
	headcount: "Headcount",
	min: "Minimum annual base",
	median: "Median annual base",
	average: "Average annual base",
	max: "Maximum annual base",
	totalTarget: "Annual target compensation",
} as const;
