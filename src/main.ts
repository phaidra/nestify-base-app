import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import config from './config';

import { AppModule } from './app.module';
import { UserModule } from './user/user.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(`api/v${process.env.API_VERSION}`);
  app.enableCors();

  const options = new DocumentBuilder()
    .setTitle(app.get('ConfigService').get('meta.title'))
    .setDescription(app.get('ConfigService').get('meta.description'))
    .setVersion(process.env.API_VERSION)
    .setBasePath(`api/v${process.env.API_VERSION}`)
    .addTag('API')
    .build();
  const document = SwaggerModule.createDocument(app, options, {
    include: [
      UserModule,
    ],
  });
  SwaggerModule.setup(`api/v${process.env.API_VERSION}/swagger`, app, document)

  await app.listen(process.env.APP_PORT);
}
bootstrap();
