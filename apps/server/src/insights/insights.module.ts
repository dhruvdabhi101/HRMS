import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { GenderPayService } from "./gender-pay.service";
import { InsightsController } from "./insights.controller";
import { InsightsService } from "./insights.service";
import { PayDistributionService } from "./pay-distribution.service";

@Module({
	imports: [PrismaModule],
	controllers: [InsightsController],
	providers: [InsightsService, PayDistributionService, GenderPayService],
})
export class InsightsModule {}
