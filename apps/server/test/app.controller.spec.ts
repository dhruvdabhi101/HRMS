import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "src/app.controller";
import { AppService } from "src/app.service";

describe("AppController", () => {
	let appController: AppController;

	beforeEach(async () => {
		const app: TestingModule = await Test.createTestingModule({
			controllers: [AppController],
			providers: [AppService],
		}).compile();

		appController = app.get<AppController>(AppController);
	});

	it('should return "Hello World!"', () => {
		expect(appController.getHello()).toBe("Hello World!");
	});

	describe("healthCheck", () => {
		it("should return status ok", () => {
			const result = appController.healthCheck();
			expect(result.status).toBe("ok");
		});

		it("should include timestamp, uptime, environment and memoryUsage", () => {
			const result = appController.healthCheck();
			expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
			expect(typeof result.uptime).toBe("string");
			expect(typeof result.environment).toBe("string");
			expect(result.memoryUsage).toHaveProperty("heapUsed");
			expect(result.memoryUsage).toHaveProperty("heapTotal");
			expect(result.memoryUsage).toHaveProperty("rss");
			expect(result.memoryUsage).toHaveProperty("external");
		});

		it("should format memory values with units", () => {
			const result = appController.healthCheck();
			const unitPattern = /[\d.]+\s+(B|KB|MB|GB)/;
			expect(result.memoryUsage.heapUsed).toMatch(unitPattern);
			expect(result.memoryUsage.heapTotal).toMatch(unitPattern);
			expect(result.memoryUsage.rss).toMatch(unitPattern);
		});

		it("should format uptime as Xd Xh Xm Xs", () => {
			const result = appController.healthCheck();
			expect(result.uptime).toMatch(/\d+d \d+h \d+m \d+s/);
		});
	});
});
