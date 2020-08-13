import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Assetref } from './interfaces/assetref.interface';
import { Model } from 'mongoose';
import { AssetrefSubmitDto} from './dto/assetref-submit.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectModel('Asset') private readonly assetRefModel: Model<Assetref>
  ) {
  }

  async submitAsset(assetrefSubmitDto: AssetrefSubmitDto, fileinfo): Promise<Assetref> {
    const assetdoc = {
      name: assetrefSubmitDto.name ? assetrefSubmitDto.name:fileinfo.originalname,
      identifier: assetrefSubmitDto.identifier,
      source: assetrefSubmitDto.source,
      originalname: fileinfo.originalname,
      path: fileinfo.path,
      size: fileinfo.size,
      mimetype: fileinfo.mimetype,
    }
    const asset = new this.assetRefModel(assetdoc);
    return await asset.save();
  }

  async createThumb(fileinfo): Promise<any> {
    console.log(fileinfo);
  }
}
