import { Body, Controller, HttpCode, HttpStatus, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetrefSubmitDto} from './dto/assetref-submit.dto';
import {
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiUseTags,
  ApiBearerAuth, ApiConsumes, ApiImplicitFile,
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
    console.log(file);
    console.log(assetMD);
    return await this.assetsService.submitAsset(assetMD, file)
  }

}
