import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SchemasService } from '../schemas/schemas.service';

async function bootstrap() {
  const application = await NestFactory.createApplicationContext(AppModule);
  const collection = process.argv[2];
  if (collection && !SchemasService.names.includes(collection)) {
    console.log('collection ', collection, 'does not exist');
    await application.close();
    process.exit(0);
  } else if (!collection) {
    SchemasService.names.forEach(n => SchemasService.bulkSortIndexUpdate(n));
    SchemasService.names.forEach(n => SchemasService.bulkFtiUpdate(n));
  } else {
    await SchemasService.bulkSortIndexUpdate(collection);
    await SchemasService.bulkFtiUpdate(collection);
  }

  //await SchemasService.bulkSortIndexUpdate(collection);

  /*  await application.close();
  process.exit(0);*/
}

bootstrap();
