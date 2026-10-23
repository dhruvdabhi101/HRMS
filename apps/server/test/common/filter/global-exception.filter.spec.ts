import { ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { GlobalExceptionFilter } from "src/common/filter/global-exception.filter";

const mockJson = vi.fn();
const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
const mockGetResponse = vi
	.fn()
	.mockReturnValue({ status: mockStatus, json: mockJson });
const mockSwitchToHttp = vi
	.fn()
	.mockReturnValue({ getResponse: mockGetResponse });

function makeHost(): ArgumentsHost {
	return { switchToHttp: mockSwitchToHttp } as unknown as ArgumentsHost;
}

describe("GlobalExceptionFilter", () => {
	let filter: GlobalExceptionFilter;

	beforeEach(() => {
		filter = new GlobalExceptionFilter();
		vi.clearAllMocks();
		mockStatus.mockReturnValue({ json: mockJson });
	});

	it("should handle HttpException with correct status and response", () => {
		const exception = new HttpException(
			{ message: "Not found" },
			HttpStatus.NOT_FOUND,
		);
		filter.catch(exception, makeHost());
		expect(mockStatus).toHaveBeenCalledWith(404);
		expect(mockJson).toHaveBeenCalledWith({ message: "Not found" });
	});

	it("should handle generic Error with status 500", () => {
		const exception = new Error("something broke");
		filter.catch(exception, makeHost());
		expect(mockStatus).toHaveBeenCalledWith(500);
		expect(mockJson).toHaveBeenCalledWith({ message: "something broke" });
	});

	it("should handle unknown non-Error exception with status 500", () => {
		filter.catch("raw string error", makeHost());
		expect(mockStatus).toHaveBeenCalledWith(500);
		expect(mockJson).toHaveBeenCalledWith({
			message: "Something went wrong",
			data: "raw string error",
		});
	});

	it("should handle unknown object exception", () => {
		filter.catch({ code: 42 }, makeHost());
		expect(mockStatus).toHaveBeenCalledWith(500);
		expect(mockJson).toHaveBeenCalledWith({
			message: "Something went wrong",
			data: { code: 42 },
		});
	});

	it("should return default message for HttpException with string response", () => {
		const exception = new HttpException("Forbidden", HttpStatus.FORBIDDEN);
		filter.catch(exception, makeHost());
		expect(mockStatus).toHaveBeenCalledWith(403);
	});
});
