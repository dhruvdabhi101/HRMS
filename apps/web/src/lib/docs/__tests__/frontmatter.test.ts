import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "../frontmatter";

describe("documentation navigation metadata", () => {
	it("keeps a concise navigation label separate from the full document title", () => {
		expect(parseFrontmatter('title: "ACME Salary Management: Requirements"\nnavTitle: Requirements')).toEqual({
			title: "ACME Salary Management: Requirements",
			navTitle: "Requirements",
		});
	});
});
