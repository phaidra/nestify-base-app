import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { v4 } from 'uuid';
import { Model } from 'mongoose';
import path from 'path';
import jimp from 'jimp/es';

import { ConfigService } from '@nestjs/config';
import { Assetref } from './interfaces/assetref.interface';
import { AssetrefSubmitDto} from './dto/assetref-submit.dto';

@Injectable()
export class AssetsService {

  constructor(
    @InjectModel('Asset') private readonly assetRefModel: Model<Assetref>,
    private readonly configService: ConfigService,
  ) {
  }

  /**
   * creates an asset document for MD of submitted asset
   * @param fileinfo
   * @param AssetMD
   */
  async submitAsset(fileinfo, AssetMD: AssetrefSubmitDto): Promise<Assetref> {
    console.log(fileinfo);
    const assetdoc = {
      name: AssetMD.name ? AssetMD.name:fileinfo.originalname,
      identifier: AssetMD.identifier,
      source: AssetMD.source,
      originalname: fileinfo.originalname,
      path: fileinfo.filename,
      size: fileinfo.size,
      mimetype: fileinfo.mimetype,
    }
    const asset = new this.assetRefModel(assetdoc);
    await this.makeImgThumb(fileinfo.filename, {width: 1500, height: 1500}, 90, 'preview');
    return await asset.save();
  }

  /**
   * middleware function creating a unique filename whilst preserving extension
   * @param req
   * @param file
   * @param callback
   */
  static editFileName(req: any, file: any, callback: any) {
    const fileExtName = path.extname(file.originalname);
    callback(null, `${v4()}${fileExtName}`);
  };


  async createThumb(fileinfo): Promise<any> {
    console.log(fileinfo);
  }

  async makeImgThumb(imgname, dims, qual, thumbname): Promise<any> {
    return new Promise( (resolve, reject) => {
      console.log(`attempting to create image for ${imgname} in ${this.configService.get('assets.dir')}/${imgname.split('.')[0]}_${thumbname}.jpg`);
      jimp.read(`${this.configService.get('assets.dir')}/${imgname}`)
        .then( img => {
          if(img) {
            if (dims && dims.height && dims.width) img.cover(dims.width, dims.height);
            if (qual) img.quality(qual);
            if (imgname && (dims || qual)) {
              img.write(`${this.configService.get('assets.thumbs')}/${imgname.split('.')[0]}_${thumbname}.jpg`, () => {
                console.log(`image created for ${imgname} in ${this.configService.get('assets.thumbs')}/${imgname.split('.')[0]}_${thumbname}.jpg`);
                resolve(`${this.configService.get('assets.thumbs')}/${imgname.split('.')[0]}_${thumbname}.jpg`);
              });
            }
          }
        })
        .catch( err => {
          console.log(`failed to read image ${this.configService.get('assets.dir')}/${imgname}`, err);
          reject(err);
        });
    });
  }
}
