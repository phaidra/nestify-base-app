import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { v4 } from 'uuid';
import { Model } from 'mongoose';
import path from 'path';
import jimp from 'jimp/es';
import { fromPath } from 'pdf2pic';
import { renameSync } from 'fs';

import { ConfigService } from '@nestjs/config';
import { Assetref } from './interfaces/assetref.interface';
import { AssetrefSubmitDto } from './dto/assetref-submit.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectModel('Assetref') private readonly assetRefModel: Model<Assetref>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * creates an asset document for MD of a submitted asset, attempts to create a corresponding thumbnail
   * @param fileinfo
   * @param AssetMD
   */
  async submitAsset(
    fileinfo: Record<any, string>,
    AssetMD: AssetrefSubmitDto,
  ): Promise<Assetref> {
    const assetdoc = {
      name: fileinfo.filename,
      identifier: [AssetMD.identifier],
      source: AssetMD.source,
      originalname: fileinfo.originalname,
      size: fileinfo.size,
      mimetype: fileinfo.mimetype,
    };
    const asset = new this.assetRefModel(assetdoc);
    await this.createThumb(fileinfo);
    return await asset.save();
  }

  /**
   * tests for mimetype and creates thumbnail if possible
   * @param fileinfo
   */
  async createThumb(fileinfo): Promise<any> {
    const imgRegex = new RegExp('^image+/(jpg|jpeg|png|gif|bmp|tiff)');
    const pdfRegex = new RegExp('^application+/(pdf)');
    switch (true) {
      case imgRegex.test(fileinfo.mimetype):
        this.makeImgThumb(
          fileinfo.filename,
          { width: 220, height: 220 },
          90,
          'thumb',
        );
        return await this.makeImgThumb(
          fileinfo.filename,
          { width: 1500, height: 1500 },
          90,
          'preview',
        );
      case pdfRegex.test(fileinfo.mimetype):
        this.makePDFThumb(
          fileinfo.filename,
          1,
          { width: 220, height: 220 },
          90,
          'thumb',
        );
        return await this.makePDFThumb(
          fileinfo.filename,
          1,
          { width: 1500, height: 1500 },
          90,
          'preview',
        );
      default:
        return new Promise(res => res(true));
    }
  }

  /**
   * creates a jpg thumbnail of an image in assets.thumbs, appends thumbname string
   * @param imgname
   * @param dims
   * @param qual
   * @param thumbname
   */
  async makeImgThumb(
    imgname: string,
    dims: Record<string, number>,
    qual: number,
    thumbname: string,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      jimp
        .read(`${this.configService.get('assets.dir')}/${imgname}`)
        .then(img => {
          if (img) {
            if (dims && dims.height && dims.width)
              img.scaleToFit(dims.width, dims.height);
            if (qual) img.quality(qual);
            if (imgname && (dims || qual)) {
              img.write(
                `${this.configService.get('assets.thumbs')}/${
                  imgname.split('.')[0]
                }_${thumbname}.jpg`,
                () => {
                  resolve(
                    `${this.configService.get('assets.thumbs')}/${
                      imgname.split('.')[0]
                    }_${thumbname}.jpg`,
                  );
                },
              );
            }
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  /**
   * creates a jpg thumbnail of this specified page of a PDF
   * @param pdfname
   * @param page
   * @param dims
   * @param qual
   * @param thumbname
   */
  async makePDFThumb(
    pdfname: string,
    page: number,
    dims: Record<string, number>,
    qual: number,
    thumbname: string,
  ) {
    return new Promise((resolve, reject) => {
      const options = {
        density: qual,
        saveFilename: `${pdfname.split('.')[0]}_${thumbname}`,
        savePath: `${this.configService.get('assets.thumbs')}`,
        format: 'jpg',
        width: dims.width,
        height: dims.height,
      };

      const PDFasImage = fromPath(
        `${this.configService.get('assets.dir')}/${pdfname}`,
        options,
      );
      PDFasImage(page, false)
        .then(img => {
          // need to remove the automatically appended page number from the file name
          // to have them smoothly named for the frontend
          const cimg = JSON.parse(JSON.stringify(img));
          const newpath = cimg.path.split('.');
          newpath.splice('-2');
          renameSync(cimg.path, `${newpath.join('.')}.jpg`);
          resolve(img);
        })
        .catch(err => {
          reject(err);
        });
    });
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
  }
}
