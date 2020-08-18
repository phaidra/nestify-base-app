import { HttpAdapterHost } from '@nestjs/core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAPIObject } from '@nestjs/swagger';
import mongooseHistory from 'mongoose-history';
import { ConverterService } from './converter.service';
import { AuthService } from '../auth/auth.service';

import * as _ from 'lodash';
import jsonSchema from 'mongoose-schema-jsonschema';
import restify from 'express-restify-mongoose';

const mongoose = jsonSchema();
import * as fs from 'fs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema, Connection } from "mongoose";
import { User } from '../user/interfaces/user.interface';

@Injectable()
export class SchemasService implements OnModuleInit {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
    private readonly converterService: ConverterService,
    private readonly adapterHost: HttpAdapterHost,
    private readonly authService: AuthService,
  ) {};

  public names: string[] = [];
  public schemas: Record<string, any>[] = [];
  public models: Model<any>[] = [];
  private history_options = {
    metadata: [
      {key: 'u', value: '__lastAccessedBy'},
      {key: 'docid', value: function(original, newObject){
          if(newObject._id) return newObject._id;
          if(!newObject._id) return newObject.origid;
        }},
    ],
    historyConnection: mongoose.connections[1],
  };

  /**
   *
   */
  onModuleInit() {

    //if not there or faulty, create schemas
    if(this.names.length < 1 ||
       this.schemas.length !== this.names.length
    ) this.initSchemas();

    //create models
    this.models = this.createModels(mongoose.connections[1], this.names, this.schemas);

    //restify models
    this.restifyModels(this.adapterHost);
  };

  /**
   *
   * @param dir
   */
  private static createNameListFromDir(dir: string): string[] {
    const fn: string[] = fs.readdirSync(dir);
    return fn
      .map(n => n.split('.')[1] == 'json' ? n.split('.')[0] : null)
      .filter(n => n !== null);
  }

  /**
   *
   * @param jsonlist
   */
  private createSchemasFromJSON(jsonlist: string[]): Schema<any>[] {
    const schemalist: Schema<any>[] = [];
    for (let i = 0; i < jsonlist.length; i++) {
      const s = JSON.parse(fs.readFileSync(`${this.configService.get<string>('schemas.dir')}/${jsonlist[i]}`, 'utf8'));
      schemalist[i] = new mongoose.Schema(this.converterService.convert(s));
      schemalist[i].plugin(mongooseHistory, this.history_options);
    }
    return schemalist;
  }

  /**
   * Fetches Schemas from a given source and sets the schemas array
   * as well as the names array
   */
  public initSchemas(): boolean {
    //TODO switch for other schema sources such as
    // owl files
    // shacle defs
    // ?
    this.names = SchemasService.createNameListFromDir(this.configService.get<string>('schemas.dir'));
    this.schemas = this.createSchemasFromJSON(this.names.map(n => `${n}.json`));
    return true;
  }

  /**
   *
   * @param db
   * @param namelist
   * @param schemalist
   */
  private createModels(db: Connection, namelist: string[], schemalist: any): Model<any>[] {
    const modellist: Model<any>[] = [];
    for (let i = 0; i < namelist.length; i++) {
      this.addReverseVirtuals(namelist[i]);
      modellist[i] = db.model(namelist[i], schemalist[i]);
    }
    return modellist;
  }

  /**
   *
   * @param host
   */
  private restifyModels(host: HttpAdapterHost) {
    for (let i = 0; i < this.names.length; i++) {
      restify.serve(host.httpAdapter, this.models[i], {
        preCreate: this.authService.validateUserExternal,
        preUpdate: this.authService.validateUserExternal,
        preDelete: this.authService.validateUserExternal,
        totalCountHeader: true,
      });
    }
  }

  /**
   *
   * @param baseurl
   */
  public getResObject(baseurl: string): Record<string, any>[] {
    const a: Record<string, any>[] = [];
    for (let i = 0; i < this.names.length; i++) {
      if (this.names[i]) a.push({
        type: this.names[i],
        '@id': `${baseurl}/${this.names[i]}`,
        attributes: this.schemas[i].jsonSchema(),
        populateablePaths: this.getPopulateablePathsFromSchemaObject(this.schemas[i].jsonSchema(), []),
        reversePaths: Object.keys(this.schemas[i].virtuals).slice(0, Object.keys(this.schemas[i].virtuals).length - 1),
      });
    }
    return a;
  };

  /**
   *
   * @param name
   */
  public jsonSchemaByName(name: string) {
    for (let i = 0; i < this.names.length; i++) {
      if (name == this.names[i]) {
        return this.schemas[i].jsonSchema();
      }
    }
    return false;
  };

  /**
   *
   * @param swaggerDoc
   * @param namelist
   * @param schemalist
   */
  private static addSwagger(swaggerDoc: OpenAPIObject, namelist: string[], schemalist: Record<string, any>[]): OpenAPIObject {
    for (let i = 0; i < namelist.length; i++) {
      SchemasService.addMongooseAPISpec(swaggerDoc, namelist[i], schemalist[i]);
    }
    return swaggerDoc;
  }

  /**
   *
   * @param doc
   */
  public addSwaggerDefs (doc: OpenAPIObject): OpenAPIObject {
    this.initSchemas();
    SchemasService.addSwagger(doc, this.names, this.schemas);
    return doc;
  }

  /**
   *
   * @param swaggerSpec
   * @param name
   * @param schema
   */
  private static addMongooseAPISpec(swaggerSpec: OpenAPIObject, name: string, schema: Record<string, any>) {
    swaggerSpec.paths[`/api/v${process.env.API_VERSION}/${name}/count`] = {
      'get': {
        'description': `Returns the number of documents of type ${name}`,
        'responses': {
          200: {
            'description': `Document Count of ${name}`,
          },
        },
        'tags': [
          `${name}`,
        ],
      },
    };
    swaggerSpec.paths[`/api/v${process.env.API_VERSION}/${name}`] = {
      'get': {
        'description': `Returns a List of ${name}s`,
        'parameters': [
          {
            'name': 'sort',
            'description': 'Key Name to Sort by, preceded by \'-\' for descending, default: _id',
            'in': 'query',
            'schema': { type: 'string' },
          },
          {
            'name': 'skip',
            'description': 'Number of records to skip from start, default: 0',
            'in': 'query',
            'schema': { type: 'string' },
          },
          {
            'name': 'limit',
            'description': 'Number of records to return, default: 10',
            'in': 'query',
            'schema': { type: 'string' },
          },
          {
            'name': 'query',
            'description': 'MongoDB Query as a well formed JSON String, ie {"name":"Bob"}',
            'in': 'query',
            'schema': { type: 'string' },
          },
          {
            'name': 'populate',
            'description': 'Path to a MongoDB reference to populate, ie [{"path":"customer"},{"path":"products"}]',
            'in': 'query',
            'schema': { type: 'string' },
          },
        ],
        'responses': {
          200: {
            'description': `Returns a List of ${name}`,
            'content':{
              'application/json': {
                'schema': { '$ref': `#/components/schemas/${name}` },
              },
            },
          },
        },
        'tags': [
          `${name}`,
        ],
      },
      'post': {
        'description': `Creates a new instance of ${name}`,
        'requestBody': {
          content: {
            'application/json': {
              'schema': { '$ref': `#/components/schemas/${name}` },
            }
          }
        },
        'responses': {
          200: {
            'description': `The created instance of ${name}`,
            'content':{
              'application/json': {
                'schema': { '$ref': `#/components/schemas/${name}` },
              },
            },
          },
        },
        'tags': [
          `${name}`,
        ],
        'security': [
          {
            'bearer': [],
          }
        ],
      },
      'delete': {
        'description': `Deletes the entire contents of collection ${name}`,
        'responses': {
          200: {
            'description': `Emptied Collection ${name}`,
          },
        },
        'tags': [
          `${name}`,
        ],
        'security': [
          {
            'bearer': [],
          }
        ],
      },
    };
    swaggerSpec.paths[`/api/v${process.env.API_VERSION}/${name}/{id}`] = {
      'get': {
        'description': `Returns the specified document of type ${name}`,
        'parameters': [
          {
            'name': 'id',
            'description': 'MongoDB document _id',
            'in': 'path',
            'schema': { type: 'string' },
            'required': true,
          },
          {
            'name': 'populate',
            'description': 'Path to a MongoDB reference to populate, ie [{"path":"customer"},{"path":"products"}]',
            'in': 'query',
            'schema': { type: 'string' },
          },
        ],
        'responses': {
          200: {
            'description': `Returns document with requested ID from collection ${name}`,
            'content':{
              'application/json': {
                'schema': { '$ref': `#/components/schemas/${name}` },
              },
            },
          },
          404: {
            'description': `No document found with requested ID in collection ${name}`,
          },
        },
        'tags': [
          `${name}`,
        ],
      },
      'post': {
        'description': 'Updates the document with the given ID',
        'parameters': [
          {
            'name': 'id',
            'description': 'MongoDB document _id',
            'in': 'path',
            'schema': { type: 'string' },
            'required': true,
          },
        ],
        'requestBody': {
          content: {
            'application/json': {
              'schema': { '$ref': `#/components/schemas/${name}` },
            }
          }
        },
        'responses': {
          200: {
            'description': `The updated instance of ${name}`,
            'content':{
              'application/json': {
                'schema': { '$ref': `#/components/schemas/${name}` },
              },
            },
          },
          404: {
            'description': `No document found with requested ID in collection ${name}`,
          },
        },
        'tags': [
          `${name}`,
        ],
        'security': [
          {
            'bearer': [],
          }
        ],
      },
      'patch': {
        'description': 'Partially updates the document with the given ID',
        'parameters': [
          {
            'name': 'id',
            'description': 'MongoDB document _id',
            'in': 'path',
            'schema': { type: 'string' },
            'required': true,
          },
        ],
        'requestBody': {
          content: {
            'application/json': {
              'schema': { '$ref': `#/components/schemas/${name}` },
            }
          }
        },
        'responses': {
          200: {
            'description': `The updated instance of ${name}`,
            'content':{
              'application/json': {
                'schema': { '$ref': `#/components/schemas/${name}` },
              },
            },
          },
          404: {
            'description': `No document found with requested ID in collection ${name}`,
          },
        },
        'tags': [
          `${name}`,
        ],
        'security': [
          {
            'bearer': [],
          }
        ],
      },
      'delete': {
        'description': 'Deletes the document with the given ID',
        'parameters': [
          {
            'name': 'id',
            'description': 'MongoDB document _id',
            'in': 'path',
            'schema': { type: 'string' },
            'required': true,
          },
        ],
        'responses': {
          204: {
            'description': 'Deleted document with given ID',
          },
          404: {
            'description': `No document found with requested ID in collection ${name}`,
          },
        },
        'tags': [
          `${name}`,
        ],
        'security': [
          {
            'bearer': [],
          }
        ],
      },
    };
    swaggerSpec.components.schemas[name] = schema.jsonSchema();
  };

  /**
   *
   * @param name
   */
  private addReverseVirtuals(name: string) {
    const t = {};
    const s = this.schemas[this.names.indexOf(name)];
    for (let i = 0; i < this.names.length; i++) {
      if (this.names[i]) {
        t[this.names[i]] = this.getPopulateablePathsFromSchemaObject(this.schemas[i].jsonSchema(), [])
          .filter(p => p.target === name)
          .map(p => p.path);
      }
    }
    for (const key in t) {
      t[key].forEach((p) => {
        s.virtual(`${key}_${p.replace(/\./, '_')}`, {
          ref: key,
          localField: '_id',
          foreignField: p,
        });
      });
    }
    return t;
  };

  /**
   *
   * @param schema
   * @param path
   */
  private getPopulateablePathsFromSchemaObject(schema: Record<string, any>, path: string[]) {
    let p = [];
    let t;
    if (path.length > 0) t = _.get(schema, path).type;
    else t = schema.type;
    if (t === 'object') {
      Object.keys(_.get(schema, path.concat(['properties']))).forEach((cp) => {
        p = p.concat(this.getPopulateablePathsFromSchemaObject(schema, path.concat(['properties', cp])));
      });
    } else if (t === 'array') {
      if (_.get(schema, path.concat(['items'])).type === 'string' && _.get(schema, path.concat(['items']))['x-ref']) {
        p.push({
          path: path.filter(a => (a !== 'properties' && a !== 'items')).join('.'),
          target: _.get(schema, path.concat(['items']))['x-ref'],
        });
      } else if (_.get(schema, path.concat(['items'])).type === 'object') {
        Object.keys(_.get(schema, path.concat(['items', 'properties']))).forEach((cp) => {
          p = p.concat(this.getPopulateablePathsFromSchemaObject(schema, path.concat(['items', 'properties', cp])));
        });
      }
    } else if (t === 'string' && _.get(schema, path)['x-ref']) {
      p.push({
        path: path.filter(a => (a !== 'properties' && a !== 'items')).join('.'),
        target: _.get(schema, path)['x-ref'],
      });
    }
    return p;
  };

}
