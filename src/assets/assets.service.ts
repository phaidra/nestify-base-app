import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Assetref } from './interfaces/assetref.interface';
import { Model } from 'mongoose';
import { AssetrefSubmitDto} from './dto/assetref-submit.dto';
import path from 'path';

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

  static editFileName(req: any, file: any, callback: any) {
    //TODO: we might need some more sanitation here?
    const name = file.originalname.split('.')[0];
    const fileExtName = path.extname(file.originalname);
    const randomName = Array(4)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    callback(null, `${name}-${randomName}${fileExtName}`);
  };

  async createThumb(fileinfo): Promise<any> {
    console.log(fileinfo);
  }
}
