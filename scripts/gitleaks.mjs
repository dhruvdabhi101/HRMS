#!/usr/bin/env node
// Runs a pinned, checksum-verified gitleaks binary, downloading it on first use.
// gitleaks is a Go binary with no official npm package, so this stands in for a
// devDependency (and works with ignore-scripts=true, unlike a postinstall).
// Usage: `pnpm gitleaks <args>`.
//
// To upgrade: bump VERSION and copy the matching lines from
// https://github.com/gitleaks/gitleaks/releases/download/v<VERSION>/gitleaks_<VERSION>_checksums.txt

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	chmodSync,
	existsSync,
	mkdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = "8.30.1";
const SHA256 = {
	darwin_arm64:
		"b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5",
	darwin_x64:
		"dfe101a4db2255fc85120ac7f3d25e4342c3c20cf749f2c20a18081af1952709",
	linux_arm64:
		"e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080",
	linux_x64: "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb",
	windows_arm64:
		"b95f5e4f5c425cedca7ee203d9afd29597e692c4924a12ed42f970537c72cc0f",
	windows_x64:
		"d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e",
};

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "node_modules", ".cache", "gitleaks", VERSION);
const isWindows = process.platform === "win32";
const bin = join(dir, isWindows ? "gitleaks.exe" : "gitleaks");

async function install() {
	const os = isWindows ? "windows" : process.platform;
	const target = `${os}_${process.arch}`;
	const expected = SHA256[target];
	if (!expected) throw new Error(`gitleaks: no pinned build for ${target}`);

	const archive = `gitleaks_${VERSION}_${target}.${isWindows ? "zip" : "tar.gz"}`;
	const url = `https://github.com/gitleaks/gitleaks/releases/download/v${VERSION}/${archive}`;
	const res = await fetch(url);
	if (!res.ok)
		throw new Error(`gitleaks: download failed (${res.status}) ${url}`);
	const body = Buffer.from(await res.arrayBuffer());

	const actual = createHash("sha256").update(body).digest("hex");
	if (actual !== expected)
		throw new Error(`gitleaks: checksum mismatch for ${archive}`);

	mkdirSync(dir, { recursive: true });
	const archivePath = join(dir, archive);
	writeFileSync(archivePath, body);
	// On Windows, call the bundled bsdtar explicitly: lefthook runs hooks under Git
	// Bash, whose GNU tar can't read .zip and parses "C:\..." as a remote host.
	const tarBin = isWindows
		? join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe")
		: "tar";
	const tar = spawnSync(tarBin, ["-xf", archivePath, "-C", dir], {
		stdio: "inherit",
	});
	rmSync(archivePath);
	if (tar.status !== 0) throw new Error("gitleaks: failed to extract archive");
	chmodSync(bin, 0o755);
}

if (!existsSync(bin)) await install();
const run = spawnSync(bin, process.argv.slice(2), { stdio: "inherit" });
process.exit(run.status ?? 1);
