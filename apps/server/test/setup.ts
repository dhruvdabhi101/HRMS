import "reflect-metadata";
import { Logger } from "@nestjs/common";

vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
vi.spyOn(console, "error").mockImplementation(() => undefined);
