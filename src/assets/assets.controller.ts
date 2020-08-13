import { Body, Controller, HttpCode, HttpStatus, Post, Res, Get, Param, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetrefSubmitDto} from './dto/assetref-submit.dto';
import {
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiUseTags,
  ApiBearerAuth, ApiConsumes, ApiImplicitFile, ApiOkResponse, ApiNotFoundResponse, ApiImplicitParam,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';

@ApiUseTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
  ) {}

  @Post('upload')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiImplicitFile({ name: 'file', required: true })
  @ApiCreatedResponse({description: 'Your File(s) have been uploaded successfully.'})
  @ApiUnauthorizedResponse({ description: 'Not authorized.'})
  @ApiBadRequestResponse({description: 'Data validation failed or Bad request..'})
  async uploadFile(@UploadedFile() file, @Body() assetMD: AssetrefSubmitDto) {

    return await this.assetsService.submitAsset(assetMD, file)
  }

  @Get(':imgpath')
  @HttpCode(HttpStatus.OK)
  @ApiImplicitParam({ name: 'imgpath', required: true })
  @ApiOkResponse({description: 'Data recieved'})
  @ApiNotFoundResponse({description: 'File not found'})
  seeUploadedFile(@Param('imgpath') image, @Res() res) {
    return res.sendFile(image, { root: './' });
  }

}
