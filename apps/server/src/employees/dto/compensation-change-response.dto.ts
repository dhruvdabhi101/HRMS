import { ApiProperty } from "@nestjs/swagger";
import { CompensationChangeResponse } from "@repo/shared";

export class CompensationChangeResponseDto
	implements CompensationChangeResponse
{
	@ApiProperty()
	id: string;
	@ApiProperty({ nullable: true, type: Number })
	oldBaseMinor: number | null;
	@ApiProperty()
	newBaseMinor: number;
	@ApiProperty({ nullable: true, type: Number })
	oldBonusBps: number | null;
	@ApiProperty()
	newBonusBps: number;
	@ApiProperty({ nullable: true, type: String })
	oldCurrencyCode: string | null;
	@ApiProperty()
	newCurrencyCode: string;
	@ApiProperty({ format: "date-time" })
	changedAt: string;
}
