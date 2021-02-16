import {
  Controller,
  Get,
  Req,
  HttpStatus,
  Param, HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { SchemasService } from './schemas.service';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class SchemasController {
  constructor(private schemasService: SchemasService) {
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({description: 'Basic API Information.'})
  apiroot(@Req() req: Request): Record<string, any> {
    return {
      data: this.schemasService.getResObject(`https://${req.header('Host')}${req.originalUrl}`),
      meta: {},
      version: {},
    }
  }

  @Get('/jsonschema/:name')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({description: 'JSON Schema representation of requested entity.'})
  @ApiNotFoundResponse({description: 'Schema not defined.'})
  jsonSchemaByName(@Param('name') name: string): Record<string, any> {
    return this.schemasService.jsonSchemaByName(name);
  }

  @Get('/search/:name/:query/:operator/:limit/:skip/:sort')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({description: 'JSON Schema representation of requested entity.'})
  @ApiNotFoundResponse({description: 'Schema not defined.'})
  search(
    @Param('name') name: string,
    @Param('query') query: string,
    @Param('operator') operator: string,
    @Param('limit') limit: string,
    @Param('skip') skip: string,
    @Param('sort') sort: string,
  ): Record<string, any> {
    return this.schemasService.ftsearch(name, query, operator, limit, skip, sort);
  }
}
