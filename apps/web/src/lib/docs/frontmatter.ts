export type Frontmatter = {
	title?: string;
	navTitle?: string;
	description?: string;
	order?: number;
};

const unquote = (value: string) =>
	value.replace(/^["']([\s\S]*)["']$/, "$1").trim();

export function parseFrontmatter(raw: string | undefined): Frontmatter {
	if (!raw) return {};

	const result: Frontmatter = {};
	for (const line of raw.split("\n")) {
		const match = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line.trim());
		if (!match) continue;

		const [, key, rawValue] = match;
		const value = unquote(rawValue ?? "");
		if (!value) continue;

		if (key === "title") result.title = value;
		if (key === "navTitle") result.navTitle = value;
		if (key === "description") result.description = value;
		if (key === "order") {
			const order = Number(value);
			if (Number.isFinite(order)) result.order = order;
		}
	}
	return result;
}
