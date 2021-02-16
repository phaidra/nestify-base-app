import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AssetsSchema} from './assets.schema';
import { diskStorage } from 'multer';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: diskStorage({
          destination: configService.get<string>('assets.dir'),
          filename: AssetsService.editFileName,
        }),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: 'Assetref', schema: AssetsSchema }]),
  ],
  controllers: [AssetsController],
  providers: [AssetsService, ConfigService]
})
export class AssetsModule {}
