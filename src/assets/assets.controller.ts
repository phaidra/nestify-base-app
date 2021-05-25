import { Body, Controller, HttpCode, HttpStatus, Post, Res, Get, Param, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiNotFoundResponse, ApiParam,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';

import { AssetsService } from './assets.service';
import { AssetrefSubmitDto} from './dto/assetref-submit.dto';

@ApiTags('assetref')
@Controller('assetref')
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('upload')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'An asset to be uploaded and some minimal metadata',
    type: AssetrefSubmitDto,
  })
  @ApiCreatedResponse({description: 'Your File(s) have been uploaded successfully.'})
  @ApiUnauthorizedResponse({ description: 'Not authorized.'})
  @ApiBadRequestResponse({description: 'Data validation failed or Bad request..'})
  async uploadFile(@UploadedFile() asset, @Body() assetMD: AssetrefSubmitDto ) {
    return await this.assetsService.submitAsset( asset, assetMD )
  }

  @Get('full/:imgpath')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'imgpath', required: true })
  @ApiOkResponse({description: 'Data recieved'})
  @ApiNotFoundResponse({description: 'File not found'})
  returnOriginalFile(@Param('imgpath') image, @Res() res) {
    return res.sendFile(image, { root: this.configService.get('assets.dir') });
  }

  @Get('thumb/:imgpath')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'imgpath', required: true })
  @ApiOkResponse({description: 'Data recieved'})
  @ApiNotFoundResponse({description: 'File not found'})
  returnThumbnail(@Param('imgpath') image, @Res() res) {
    return res.sendFile(`${image.split('.')[0]}_thumb.jpg`, { root: this.configService.get('assets.thumbs') });
  }

  @Get('preview/:imgpath')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'imgpath', required: true })
  @ApiOkResponse({description: 'Data recieved'})
  @ApiNotFoundResponse({description: 'File not found'})
  returnPreview(@Param('imgpath') image, @Res() res) {
    return res.sendFile(`${image.split('.')[0]}_preview.jpg`, { root: this.configService.get('assets.thumbs') });
  }

}
