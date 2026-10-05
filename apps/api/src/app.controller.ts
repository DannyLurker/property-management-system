import { Controller, Get } from "@nestjs/common";
import { features } from "./config/features";

@Controller()
export class AppController {
  @Get("health")
  health() {
    return { status: "ok", version: "0.1.0", features };
  }
}
