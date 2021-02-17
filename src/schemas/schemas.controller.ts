import {
  Controller,
  Get,
  Req,
  HttpStatus,
  Param, HttpCode, Query, Response
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

  @Get('/search/:type/:query')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({description: 'An Array of the requested Entities.'})
  @ApiNotFoundResponse({description: 'Nothing Found.'})
  async search(
    @Param('type') type: string,
    @Param('query') query: string,
    @Query('operator') operator: string,
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('sort') sort: string,
    @Response() res,
  ) {
    let results = await this.schemasService.ftsearch(type, query, operator, limit, skip, sort);
    return res.set({'X-Total-Count': results[0].total }).json(results[0].data);
  }
}
