import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import config from './config';

import { AppModule } from './app.module';
import { UserModule } from './user/user.module';
import { SchemasModule } from './schemas/schemas.module';
import { AssetsModule } from './assets/assets.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(`api/v${process.env.API_VERSION}`);
  app.enableCors();

  const options = new DocumentBuilder()
    .setTitle(app.get('ConfigService').get('meta.title'))
    .setDescription(app.get('ConfigService').get('meta.description'))
    .setVersion(process.env.API_VERSION)
    .addBearerAuth('Authorization', 'header')
    .setBasePath(`api/v${process.env.API_VERSION}`)
    .build();
  const document = SwaggerModule.createDocument(app, options, {
    include: [
      UserModule,
      SchemasModule,
      AssetsModule,
    ],
  });

  app.get('SchemasService').addSwaggerDefs(document);
  SwaggerModule.setup(`api/v${process.env.API_VERSION}/swagger`, app, document);

  await app.listen(process.env.APP_PORT).then(() => {
    console.log('listening');
  });
}

bootstrap();
