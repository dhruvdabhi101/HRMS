import { Separator } from "@repo/ui/components/separator";
import { SidebarInset, SidebarTrigger } from "@repo/ui/components/sidebar";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideMarkdown } from "@/components/docs/GuideMarkdown";
import { GuidePager } from "@/components/docs/GuidePager";
import { GuideToc } from "@/components/docs/GuideToc";
import {
	getGuideNeighbours,
	getGuidePage,
	getGuidePages,
} from "@/lib/docs/source";

type GuidePageProps = {
	params: Promise<{ slug?: string[] }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
	return getGuidePages().map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
	params,
}: GuidePageProps): Promise<Metadata> {
	const { slug = [] } = await params;
	const page = getGuidePage(slug);

	return {
		title: page ? `${page.title} · Docs` : "Docs",
		description: page?.description,
	};
}

export default async function GuidePage({ params }: GuidePageProps) {
	const { slug = [] } = await params;
	const page = getGuidePage(slug);

	if (!page) notFound();

	const { previous, next } = getGuideNeighbours(page.href);

	return (
		<SidebarInset>
			<header className="bg-background sticky top-0 z-10 flex h-16 min-w-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1 shrink-0" />
				<Separator
					orientation="vertical"
					className="mr-2 my-auto h-4 shrink-0"
				/>
				<span className="truncate text-sm font-medium" title={page.title}>
					{page.navTitle ?? page.title}
				</span>
			</header>
			<div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_14rem] lg:px-10">
				<article className="min-w-0 max-w-3xl">
					<header className="mb-8 border-b pb-8">
						<h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
							{page.title}
						</h1>
						{page.description && (
							<p className="text-muted-foreground mt-3 text-lg leading-8">
								{page.description}
							</p>
						)}
					</header>
					<GuideMarkdown document={page.document} />
					<GuidePager previous={previous} next={next} />
				</article>
				<aside className="sticky top-24 hidden h-fit lg:block">
					<GuideToc headings={page.headings} />
				</aside>
			</div>
		</SidebarInset>
	);
}
