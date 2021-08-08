import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppClusterService } from './app-cluster.service';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      validateCustomDecorators: true,
    }),
  );
  app.enableCors();
  await app.listen(process.env.APPLICATION_PORT);
}
// bootstrap();
AppClusterService.clusterize(bootstrap);
