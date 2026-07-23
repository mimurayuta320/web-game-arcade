import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const host = process.env.HOST ?? process.env.CLOUD_HOST ?? '0.0.0.0';
  const port = Number(process.env.PORT ?? process.env.CLOUD_PORT ?? 8787);
  await app.listen(port, host);
}
bootstrap();
