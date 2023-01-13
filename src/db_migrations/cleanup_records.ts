import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SchemasService } from '../schemas/schemas.service';
import _ from 'lodash';

async function bootstrap() {
  const application = await NestFactory.createApplicationContext(AppModule);

  const collection = process.argv[2];
  if (!SchemasService.names.includes(collection)) {
    console.log('collection ', collection, 'does not exist');
    await application.close();
    process.exit(0);
  }
  const m = SchemasService.models[SchemasService.names.indexOf(collection)];
  const rv = SchemasService.getReverseVirtualsBySchemaName(collection);
  console.log(rv);
  const records = await m.find().populate(rv);
  for (const r of records) {
    let rvcount = 0;
    rv.forEach(rvi => {
      if (r[rvi]) rvcount += r[rvi].length;
    });
    if (rvcount === 0) {
      console.log(r.name);
      await m.deleteOne({ _id: r._id });
    }
    /*
    const e = await r.save();
    if(e && e.errors) console.log(e);
*/
  }
  await application.close();
  process.exit(0);
}

bootstrap();
