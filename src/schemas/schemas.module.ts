import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SchemasService } from './schemas.service';
import { ConverterService } from './converter.service';
import { SchemasController } from './schemas.controller';

@Global()
@Module({
  imports: [MongooseModule],
  providers: [SchemasService, ConverterService],
  controllers: [SchemasController],
  exports: [SchemasService],
})
export class SchemasModule {
}
