import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { UserModule } from './user/user.module';
import { SchemasModule } from './schemas/schemas.module';
import { AssetsModule } from './assets/assets.module';
import { ConfigService } from '@nestjs/config';
import {SchemasService} from "./schemas/schemas.service";


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(`api/v${app.get(ConfigService).get('version')}`);
  app.enableCors(app.get(ConfigService).get('cors'));

  const options = new DocumentBuilder()
    .setTitle(app.get(ConfigService).get('meta.title'))
    .setDescription(app.get(ConfigService).get('meta.description'))
    .setVersion(app.get(ConfigService).get('version'))
    .addBearerAuth({type: 'http', scheme: 'bearer', bearerFormat: 'JWT'}, 'bearer')
    .build();
  const document = SwaggerModule.createDocument(app, options, {
    include: [
      UserModule,
      SchemasModule,
      AssetsModule,
    ],
  });

  app.get(SchemasService).addSwaggerDefs(document);
  SwaggerModule.setup(`api/v${app.get(ConfigService).get('version')}/swagger`, app, document);

  await app.listen(app.get(ConfigService).get('env.port')).then(() => {
    console.log('listening');
  });
}

bootstrap();
