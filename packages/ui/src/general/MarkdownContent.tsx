/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: needed */
import { streamingMarkdownExtension } from "@tanstack/markdown/extensions/streaming";
import { Markdown, type MarkdownComponents } from "@tanstack/markdown/react";
import DOMPurify from "isomorphic-dompurify";
import type { ComponentPropsWithoutRef } from "react";

const FORBIDDEN_TAGS = ["script", "style", "iframe", "object", "embed", "form"];

export function sanitizeMarkdownHtml(html: string): string {
	return DOMPurify.sanitize(html, { FORBID_TAGS: FORBIDDEN_TAGS });
}

const extensions = [streamingMarkdownExtension()];

type RawHtml = { __html: string | TrustedHTML } | undefined;

const sanitized = (html: RawHtml) => ({
	__html: sanitizeMarkdownHtml(String(html?.__html ?? "")),
});

const components = {
	a: ({ href, ...props }) => {
		const isSamePage =
			!href?.startsWith("http:") || href?.includes(window.location.origin);

		return (
			<a
				{...props}
				href={href}
				target={isSamePage ? "_self" : "_blank"}
				rel="noopener noreferrer nofollow"
			/>
		);
	},
	div: ({
		dangerouslySetInnerHTML,
		...props
	}: ComponentPropsWithoutRef<"div">) =>
		dangerouslySetInnerHTML ? (
			<div
				{...props}
				dangerouslySetInnerHTML={sanitized(dangerouslySetInnerHTML)}
			/>
		) : (
			<div {...props} />
		),
	span: ({
		dangerouslySetInnerHTML,
		...props
	}: ComponentPropsWithoutRef<"span">) =>
		dangerouslySetInnerHTML ? (
			<span
				{...props}
				dangerouslySetInnerHTML={sanitized(dangerouslySetInnerHTML)}
			/>
		) : (
			<span {...props} />
		),
	table: (props) => (
		<div className="typeset-scroll">
			<table {...props} />
		</div>
	),
} satisfies MarkdownComponents;

export default function CustomMarkdown({
	content,
	className,
	headingIds = false,
	allowHtml = true,
}: {
	content: string;
	className?: string;
	headingIds?: boolean;
	allowHtml?: boolean;
}) {
	return (
		<div className={`typeset ${className ?? ""}`}>
			<Markdown
				allowHtml={allowHtml}
				extensions={extensions}
				frontmatter={false}
				headingIds={headingIds}
				components={components}
			>
				{content}
			</Markdown>
		</div>
	);
}
