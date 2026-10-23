export function parseCsv(input: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = "";
	let quoted = false;
	const csv = input.replace(/^\uFEFF/, "");
	for (let index = 0; index < csv.length; index++) {
		const character = csv[index];
		if (character === '"') {
			if (quoted && csv[index + 1] === '"') {
				cell += '"';
				index++;
			} else quoted = !quoted;
		} else if (!quoted && character === ",") {
			row.push(cell);
			cell = "";
		} else if (!quoted && (character === "\r" || character === "\n")) {
			if (character === "\r" && csv[index + 1] === "\n") index++;
			rows.push([...row, cell]);
			row = [];
			cell = "";
		} else cell += character;
	}
	if (quoted) throw new Error("CSV contains an unclosed quoted cell");
	if (row.length || cell) rows.push([...row, cell]);
	return rows;
}
