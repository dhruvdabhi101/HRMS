import { parseMarkdown } from "@tanstack/markdown/parser";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GuideMarkdown } from "../GuideMarkdown";

afterEach(cleanup);

describe("documentation diagram images", () => {
	it("serves a repository-relative public image through its published URL", () => {
		const document = parseMarkdown('![Application architecture](../apps/web/public/diagrams/architecture.svg)');
		render(<GuideMarkdown document={document} />);
		expect(screen.getByRole("img", { name: "Application architecture" }).getAttribute("src")).toBe("/diagrams/architecture.svg");
	});

	it("preserves an ordinary image URL", () => {
		const document = parseMarkdown('![Setup screen](/setup.png)');
		render(<GuideMarkdown document={document} />);
		expect(screen.getByRole("img", { name: "Setup screen" }).getAttribute("src")).toBe("/setup.png");
	});
});
