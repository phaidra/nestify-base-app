import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { v4 } from 'uuid';
import { Model } from 'mongoose';
import path from 'path';
import Jimp from 'jimp/es';

import { Assetref } from './interfaces/assetref.interface';
import { AssetrefSubmitDto} from './dto/assetref-submit.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectModel('Asset') private readonly assetRefModel: Model<Assetref>
  ) {
  }

  /**
   * creates an asset document for MD of submitted asset
   * @param fileinfo
   * @param AssetMD
   */
  async submitAsset(fileinfo, AssetMD: AssetrefSubmitDto): Promise<Assetref> {
    const assetdoc = {
      name: AssetMD.name ? AssetMD.name:fileinfo.originalname,
      identifier: AssetMD.identifier,
      source: AssetMD.source,
      originalname: fileinfo.originalname,
      path: fileinfo.path,
      size: fileinfo.size,
      mimetype: fileinfo.mimetype,
    }
    const asset = new this.assetRefModel(assetdoc);
    return await asset.save();
  }

  /**
   * middleware function creating a unique filename whilst preserving extension
   * @param req
   * @param file
   * @param callback
   */
  static editFileName(req: any, file: any, callback: any) {
    //TODO: we might need some more sanitation here?
    const name = file.originalname.split('.')[0];
    const fileExtName = path.extname(file.originalname);
    callback(null, `${name}-${v4()}${fileExtName}`);
  };


  async createThumb(fileinfo): Promise<any> {
    console.log(fileinfo);
  }

/*  makeImgThumb(imgname, dims, qual, thumbname) {
    return new Promise( function(resolve, reject){
      console.log(`attempting to create image for ${imgname} in ${CONFIG.assets.thumbs}/${imgname.split('.')[0]}_${thumbname}.jpg`);
      jimp.read(`${CONFIG.assets.dir}/${imgname}`)
        .then( img => {
          if(img) {
            if (dims && dims.height && dims.width) img.cover(dims.width, dims.height);
            if (qual) img.quality(qual);
            if (imgname && (dims || qual)) {
              img.write(`${CONFIG.assets.thumbs}/${imgname.split('.')[0]}_${thumbname}.jpg`, () => {
                console.log(`image created for ${imgname} in ${CONFIG.assets.thumbs}/${imgname.split('.')[0]}_${thumbname}.jpg`);
                resolve(`${CONFIG.assets.thumbs}/${imgname.split('.')[0]}_${thumbname}.jpg`);
              });
            }
          }
        })
        .catch( err => {
          console.log(`failed to read image ${CONFIG.assets.dir}/${imgname}`, err);
          reject(err);
        });
    });
  },*/
}
