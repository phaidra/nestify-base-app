import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConceptSchema } from './schemas/concept.schema';
import { AuthrecSchema } from './schemas/authrec.schema';
import { AuthModule } from 'src/auth/auth.module';
import { VocabController } from './vocab.controller';
import { VocabService } from './vocab.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Concept', schema: ConceptSchema }]),
    MongooseModule.forFeature([{ name: 'Authrec', schema: AuthrecSchema }]),
    AuthModule,
  ],
  controllers: [VocabController],
  providers: [VocabService],
})
export class VocabModule {}
