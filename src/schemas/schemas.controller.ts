import {
  Controller,
  Get,
  Req,
  HttpStatus,
  Post,
  Body,
  Put,
  Query,
  NotFoundException,
  Delete,
  Param, HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { SchemasService } from './schemas.service';
import {
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiUseTags,
} from '@nestjs/swagger';

@ApiUseTags('Root')
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
  @ApiOkResponse({description: 'JSON Schema Representation of Requested Object.'})
  jsonSchemaByName(@Param('name') name: string): Record<string, any> {
    return this.schemasService.jsonSchemaByName(name);
  }
}
