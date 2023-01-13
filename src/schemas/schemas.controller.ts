import {
  Controller,
  Get,
  Req,
  HttpStatus,
  Param,
  HttpCode,
  Query,
  Response,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { SchemasService } from './schemas.service';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Root')
@Controller()
export class SchemasController {
  constructor(private schemasService: SchemasService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Basic API Information.' })
  apiroot(@Req() req: Request): Record<string, any> {
    return {
      data: this.schemasService.getResObject(
        `https://${req.header('Host')}${req.originalUrl}`,
      ),
      meta: {},
      version: {},
    };
  }

  @Get('/jsonschema/:name')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'JSON Schema representation of requested entity.',
  })
  @ApiNotFoundResponse({ description: 'Schema not defined.' })
  jsonSchemaByName(@Param('name') name: string): Record<string, any> {
    return this.schemasService.jsonSchemaByName(name);
  }

  @Get('/updatesearch/:type')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'The Number of updated records.' })
  @ApiNotFoundResponse({ description: 'Record Type not found.' })
  async updatesearch(@Param('type') type: string, @Response() res) {
    const updated = await SchemasService.bulkFtiUpdate(type);
    return res.json(updated);
  }

  @Get('/updatesort/:type')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'The Number of updated records.' })
  @ApiNotFoundResponse({ description: 'Record Type not found.' })
  async updatesort(@Param('type') type: string, @Response() res) {
    const updated = await SchemasService.bulkSortIndexUpdate(type);
    return res.json(updated);
  }
}
