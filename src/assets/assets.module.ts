import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AssetsSchema} from './assets.schema';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        dest: configService.get<string>('assets.dir'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: 'Asset', schema: AssetsSchema }]),
  ],
  controllers: [AssetsController],
  providers: [AssetsService]
})
export class AssetsModule {}
