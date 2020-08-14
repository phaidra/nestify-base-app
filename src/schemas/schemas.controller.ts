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
    return this.schemasService.getResObject(`https://${req.header('Host')}${req.originalUrl}`);
  }

  @Get('/jsonschema/:name')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({description: 'JSON Schema representation of requested entity.'})
  @ApiNotFoundResponse({description: 'Schema not defined.'})
  jsonSchemaByName(@Param('name') name: string): Record<string, any> {
    return this.schemasService.jsonSchemaByName(name);
  }
}
