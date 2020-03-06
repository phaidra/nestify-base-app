import { Controller, Get, Req, HttpStatus, Post, Body, Put, Query, NotFoundException, Delete, Param } from '@nestjs/common';
import { Request } from 'express';
import { SchemasService } from './schemas.service';

@Controller()
export class SchemasController {
  constructor(private schemasService: SchemasService) { }

  @Get()
  apiroot(@Req() req: Request): Record<string, any> {
    return this.schemasService.getResObject(`https://${req.header('Host')}${req.originalUrl}`);
  }

  @Get('/jsonschema/:name')
  jsonSchemaByName(@Param('name') name): Record<string, any> {
    return this.schemasService.jsonSchemaByName(name);
  }
}
