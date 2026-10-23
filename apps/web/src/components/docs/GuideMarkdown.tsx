import type { MarkdownDocument } from "@tanstack/markdown";
import { Markdown, type MarkdownComponents } from "@tanstack/markdown/react";
import Link from "next/link";
import {
	Children,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from "react";
import { guideExtensions } from "@/lib/docs/source";
import { GuideImage } from "./GuideImage";

const isInternal = (href: string | undefined) =>
	Boolean(href?.startsWith("/") && !href.startsWith("//"));

const isImage = (
	node: ReactNode,
): node is ReactElement<{ src?: string; alt?: string }> =>
	isValidElement(node) && node.type === "img";

const components = {
	a: ({ href, ...props }) =>
		isInternal(href) ? (
			<Link href={href as string} {...props} />
		) : (
			<a {...props} href={href} target="_blank" rel="noopener noreferrer" />
		),
	table: (props) => (
		<div className="typeset-scroll">
			<table {...props} />
		</div>
	),
	p: ({ children, ...props }) => {
		const content = Children.toArray(children).filter(
			(child) => typeof child !== "string" || child.trim(),
		);
		const image = content.length === 1 ? content[0] : undefined;

		if (!isImage(image) || !image.props.src)
			return <p {...props}>{children}</p>;

		return (
			<GuideImage
				src={image.props.src.replace(/^\.\.\/apps\/web\/public\//, "/")}
				alt={image.props.alt}
			/>
		);
	},
} satisfies MarkdownComponents;

export function GuideMarkdown({ document }: { document: MarkdownDocument }) {
	return (
		<div className="typeset guide-typeset">
			<Markdown extensions={guideExtensions} components={components}>
				{document}
			</Markdown>
		</div>
	);
}
