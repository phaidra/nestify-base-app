import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SchemasService} from '../schemas/schemas.service';
import _ from 'lodash';

async function bootstrap() {
  const application = await NestFactory.createApplicationContext(
    AppModule,
  );

  const collection = process.argv[2];
  if (!SchemasService.names.includes(collection)) {
    console.log('collection ',collection,'does not exist');
    await application.close();
    process.exit(0);
  }
  const m = SchemasService.models[SchemasService.names.indexOf(collection)];
  const records = await m.find();
  for (const r of records) {
/*    if (r.partOf === null || !r.partOf) r.partOf = '5c90a033d26c5d0796d7378a';
    if (r.relations) r.relations.forEach(rel => {
      if(rel.kind === null) rel.kind = 'related';
    })*/
    const e = await r.save();
    if(e && e.errors) console.log(e);
  }
  await application.close();
  process.exit(0);
}

bootstrap();
