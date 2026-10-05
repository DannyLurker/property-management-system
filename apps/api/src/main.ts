import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.use(helmet());
  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
}

bootstrap();
