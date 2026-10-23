import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { AppService } from "./app.service";
import { config } from "./common/config";

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	getHello(): string {
		return this.appService.getHello();
	}

	@Get("health")
	@SkipThrottle()
	healthCheck() {
		const formatBytes = (bytes: number): string => {
			const units = ["B", "KB", "MB", "GB"];
			let size = bytes;
			let unitIndex = 0;
			while (size >= 1024 && unitIndex < units.length - 1) {
				size /= 1024;
				unitIndex++;
			}
			return `${size.toFixed(2)} ${units[unitIndex]}`;
		};

		const formatUptime = (seconds: number): string => {
			const days = Math.floor(seconds / (24 * 60 * 60));
			const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
			const minutes = Math.floor((seconds % (60 * 60)) / 60);
			const remainingSeconds = Math.floor(seconds % 60);
			return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
		};

		const memory = process.memoryUsage();

		return {
			status: "ok",
			timestamp: new Date().toISOString(),
			environment: config.environment,
			uptime: formatUptime(process.uptime()),
			memoryUsage: {
				heapUsed: formatBytes(memory.heapUsed),
				heapTotal: formatBytes(memory.heapTotal),
				rss: formatBytes(memory.rss),
				external: formatBytes(memory.external),
			},
		};
	}
}
