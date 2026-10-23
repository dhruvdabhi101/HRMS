import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { MarkdownDocument, MarkdownHeading } from "@tanstack/markdown";
import { docsMarkdownExtensions } from "@tanstack/markdown/extensions/docs";
import { parseMarkdown } from "@tanstack/markdown/parser";
import { cache } from "react";
import { parseFrontmatter } from "./frontmatter";

export const GUIDE_ROOT = join(process.cwd(), "..", "..", "docs");
export const GUIDE_BASE_PATH = "/docs";

export const guideExtensions = docsMarkdownExtensions();

export type GuidePage = {
	slug: string[];
	href: string;
	title: string;
	navTitle?: string;
	description?: string;
	order: number;
	document: MarkdownDocument;
	headings: MarkdownHeading[];
	rawSegments: string[];
};

export type GuideNavItem = {
	title: string;
	href: string;
	slug: string[];
	description?: string;
	hasPage: boolean;
	children: GuideNavItem[];
};

const ORDER_PREFIX = /^(\d+)[-_]/;

const stripOrderPrefix = (segment: string) => segment.replace(ORDER_PREFIX, "");

const orderFromSegment = (segment: string) => {
	const match = ORDER_PREFIX.exec(segment);
	return match ? Number(match[1]) : undefined;
};

const titleFromSlug = (segment: string) =>
	segment
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

const hrefFor = (slug: string[]) =>
	slug.length ? `${GUIDE_BASE_PATH}/${slug.join("/")}` : GUIDE_BASE_PATH;

const readDocument = (filePath: string) => {
	const source = readFileSync(filePath, "utf8");
	const document = parseMarkdown(source, {
		extensions: guideExtensions,
		frontmatter: true,
		headingIds: true,
	});
	return { document, frontmatter: parseFrontmatter(document.frontmatter) };
};

const firstHeading = (document: MarkdownDocument) =>
	document.headings?.find((heading) => heading.level === 1)?.text;

const toPage = (
	filePath: string,
	slug: string[],
	rawSegments: string[],
): GuidePage => {
	const { document, frontmatter } = readDocument(filePath);
	const body =
		document.children[0]?.type === "heading" && document.children[0].depth === 1
			? { ...document, children: document.children.slice(1) }
			: document;

	return {
		slug,
		href: hrefFor(slug),
		title:
			frontmatter.title ??
			firstHeading(document) ??
			titleFromSlug(slug.at(-1) ?? "Guide"),
		description: frontmatter.description,
		navTitle: frontmatter.navTitle,
		order:
			frontmatter.order ??
			orderFromSegment(rawSegments.at(-1) ?? "") ??
			Number.MAX_SAFE_INTEGER,
		document: body,
		headings: (document.headings ?? []).filter(
			(heading) => heading.level > 1 && heading.level < 4,
		),
		rawSegments,
	};
};

const collectPages = (dir: string): GuidePage[] => {
	if (!existsSync(dir)) return [];

	return readdirSync(dir).flatMap((entry) => {
		const entryPath = join(dir, entry);
		if (statSync(entryPath).isDirectory()) return collectPages(entryPath);
		if (!entry.endsWith(".md")) return [];

		const rawSegments = relative(GUIDE_ROOT, entryPath)
			.replace(/\.md$/, "")
			.split(sep);
		const segments = rawSegments
			.map(stripOrderPrefix)
			.filter((segment) => segment !== "index");

		return [toPage(entryPath, segments, rawSegments)];
	});
};

export const getGuidePages = cache((): GuidePage[] => collectPages(GUIDE_ROOT));

export const getGuidePage = cache((slug: string[]): GuidePage | undefined =>
	getGuidePages().find((page) => page.href === hrefFor(slug)),
);

export const getGuideNav = cache((): GuideNavItem[] => {
	const roots: GuideNavItem[] = [];
	const byHref = new Map<string, GuideNavItem>();

	const ensure = (slug: string[]): GuideNavItem => {
		const href = hrefFor(slug);
		const existing = byHref.get(href);
		if (existing) return existing;

		const item: GuideNavItem = {
			title: titleFromSlug(slug.at(-1) ?? "Guide"),
			href,
			slug,
			hasPage: false,
			children: [],
		};
		byHref.set(href, item);

		if (slug.length <= 1) roots.push(item);
		else ensure(slug.slice(0, -1)).children.push(item);

		return item;
	};

	const orders = new Map<string, number>();

	for (const page of getGuidePages()) {
		if (!page.slug.length) continue;

		for (const [index, segment] of page.rawSegments.entries()) {
			const href = hrefFor(page.slug.slice(0, index + 1));
			const order = orderFromSegment(segment);
			if (order !== undefined && !orders.has(href)) orders.set(href, order);
		}

		const item = ensure(page.slug);
		item.title = page.navTitle ?? page.title;
		item.description = page.description;
		item.hasPage = true;
		orders.set(item.href, page.order);
	}

	const sort = (items: GuideNavItem[]): GuideNavItem[] =>
		items
			.map((item) => ({ ...item, children: sort(item.children) }))
			.sort((a, b) => {
				const delta =
					(orders.get(a.href) ?? Number.MAX_SAFE_INTEGER) -
					(orders.get(b.href) ?? Number.MAX_SAFE_INTEGER);
				return delta !== 0 ? delta : a.title.localeCompare(b.title);
			});

	return sort(roots);
});

export const getGuideFlatNav = cache((): GuideNavItem[] => {
	const flatten = (items: GuideNavItem[]): GuideNavItem[] =>
		items.flatMap((item) => [item, ...flatten(item.children)]);
	return flatten(getGuideNav()).filter((item) => item.hasPage);
});

export const getGuideNeighbours = cache((href: string) => {
	const flat = getGuideFlatNav();
	const index = flat.findIndex((item) => item.href === href);
	if (index === -1) return { previous: undefined, next: undefined };
	return { previous: flat[index - 1], next: flat[index + 1] };
});
