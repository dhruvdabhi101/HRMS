import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "@repo/ui/components/sidebar";
import { GuideImage } from "../GuideImage";
import { GuidePager } from "../GuidePager";
import { GuideSidebar } from "../GuideSidebar";
import { GuideToc } from "../GuideToc";

vi.mock("next/navigation", () => ({ usePathname: () => "/docs/setup" }));

class IntersectionObserverStub {
	observe() {}
	disconnect() {}
}

globalThis.IntersectionObserver = IntersectionObserverStub as never;
window.matchMedia = vi.fn().mockImplementation(() => ({
	matches: false,
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
}));

describe("guide navigation", () => {
	it("renders pager directions only when neighboring pages exist", () => {
		const { rerender } = render(<GuidePager />);
		expect(screen.queryByRole("navigation")).toBeNull();
		rerender(<GuidePager previous={{ title: "Intro", href: "/docs", slug: ["intro"], children: [], hasPage: true }} next={{ title: "Setup", href: "/docs/setup", slug: ["setup"], children: [], hasPage: true }} />);
		expect(screen.getByRole("link", { name: /Previous.*Intro/i }).getAttribute("href")).toBe("/docs");
		expect(screen.getByRole("link", { name: /Next.*Setup/i }).getAttribute("href")).toBe("/docs/setup");
	});

	it("opens an image dialog and includes optional captions", () => {
		render(<GuideImage src="/setup.png" alt="Setup screen" />);
		expect(screen.getByText("Setup screen")).not.toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "Enlarge: Setup screen" }));
		expect(screen.getByRole("dialog")).not.toBeNull();
	});

	it("renders active guide navigation and collapsible nested sections", () => {
		render(<SidebarProvider><GuideSidebar nav={[{ title: "Setup", href: "/docs/setup", slug: ["setup"], hasPage: true, children: [{ title: "Install", href: "/docs/setup/install", slug: ["setup", "install"], hasPage: true, children: [] }] }]} /></SidebarProvider>);
		expect(screen.getByRole("link", { name: "Overview" }).getAttribute("href")).toBe("/docs");
		expect(screen.getByRole("link", { name: "Setup" }).getAttribute("href")).toBe("/docs/setup");
		expect(screen.getByRole("link", { name: "Install" }).getAttribute("href")).toBe("/docs/setup/install");
		fireEvent.click(screen.getByRole("button", { name: "Toggle Setup" }));
	});

	it("renders nothing without headings and links headings when present", () => {
		const { rerender } = render(<GuideToc headings={[]} />);
		expect(screen.queryByRole("navigation")).toBeNull();
		document.body.insertAdjacentHTML("beforeend", '<h2 id="intro">Intro</h2>');
		rerender(<GuideToc headings={[{ id: "intro", text: "Intro", level: 2 }, { id: "details", text: "Details", level: 3 }]} />);
		expect(screen.getByRole("link", { name: "Intro" }).getAttribute("href")).toBe("#intro");
		expect(screen.getByRole("link", { name: "Details" }).className).toContain("pl-6");
	});
});
