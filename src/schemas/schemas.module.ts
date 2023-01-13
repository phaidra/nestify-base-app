import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';

import { SchemasService } from './schemas.service';
import { ConverterService } from './converter.service';
import { SchemasController } from './schemas.controller';
import { UserSchema } from '../user/schemas/user.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: '_User', schema: UserSchema }]),
    AuthModule,
  ],
  providers: [SchemasService, ConverterService],
  controllers: [SchemasController],
  exports: [SchemasService],
})
export class SchemasModule {}
