import { HttpAdapterHost } from '@nestjs/core';
import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerDocument, SwaggerModule } from '@nestjs/swagger';
import { ConverterService } from './converter.service';

import * as _ from 'lodash';
import jsonSchema from 'mongoose-schema-jsonschema';
import restify from 'express-restify-mongoose';

const mongoose = jsonSchema();
import * as fs from 'fs';

@Injectable()
export class SchemasService implements OnModuleInit {
  constructor(private readonly configService: ConfigService,
              private readonly converterService: ConverterService,
              private readonly adapterHost: HttpAdapterHost) {
  };

  readonly names: string[] = [];
  readonly rawjson: Record<string, any>[] = [];
  readonly schemas: Record<string, any>[] = [];
  readonly models: Record<string, any>[] = [];
  public swaggerDoc: SwaggerDocument;
  public app: INestApplication = null;

  /**
   *
   */
  onModuleInit() {
    const fn = fs.readdirSync(this.configService.get<string>('schemas.dir'));

    //create schemas
    for (let i = 0; i < fn.length; i++) {
      if (/.*\.json/.test(fn[i]) && !/_.*/.test(fn[i])) {
        console.log(`initializing schema ${fn[i]}.`);
        const s = JSON.parse(fs.readFileSync(`${this.configService.get<string>('schemas.dir')}/${fn[i]}`, 'utf8'));
        this.rawjson[i] = s;
        this.names[i] = fn[i].split('.')[0];
        this.schemas[i] = new mongoose.Schema(this.converterService.convert(s));
      }
    }

    //create models
    for (let i = 0; i < this.names.length; i++) {
      if (this.names[i]) {
        console.log(`initializing models for ${this.names[i]}`);
        this.addReverseVirtuals(this.names[i]);
        this.models[i] = mongoose.connections[1].model(this.names[i], this.schemas[i]);
      }
    }

    //restify models
    const appinstance = this.adapterHost.httpAdapter;
    for (let i = 0; i < this.names.length; i++) {
      console.log(`restifying models for ${this.names[i]}`);
      if (this.names[i]) {
        restify.serve(appinstance, this.models[i]);
      }
    }
    this.addSwagger(this.swaggerDoc);
    SwaggerModule.setup(`api/v${process.env.API_VERSION}/swagger`, this.app, this.swaggerDoc);
  };

  /**
   *
   * @param baseurl
   */
  public getResObject(baseurl: string) {
    const a = [];
    for (let i = 0; i < this.names.length; i++) {
      if (this.names[i]) a.push({
        type: this.names[i],
        id: `${baseurl}${this.names[i]}`,
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
        //we may need put some additional logic here, if front end needs it
        return this.schemas[i].jsonSchema();
      }
    }
    return false;
  };

  public addSwagger(swaggerDoc) {
    for (let i = 0; i < this.names.length; i++) {
      if (this.names[i]) {
        console.log(`adding OpenAPI documentation for ${this.names[i]}`);
        this.addMongooseAPISpec(swaggerDoc, this.names[i], this.schemas[i]);
      }
    }
  }

  /**
   *
   * @param swaggerSpec
   * @param name
   * @param schema
   */
  private addMongooseAPISpec(swaggerSpec, name, schema) {
    swaggerSpec.paths[`/${name}/count`] = {
      'get': {
        'description': `Returns the number of documents of type ${name}`,
        'produces': ['application/json'],
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
    swaggerSpec.paths[`/${name}`] = {
      'get': {
        'description': `Returns a List of ${name}s`,
        'produces': ['application/json'],
        'parameters': [
          {
            'name': 'sort',
            'description': 'Key Name to Sort by, preceded by \'-\' for descending, default: _id',
            'in': 'query',
            'type': 'string',
          },
          {
            'name': 'skip',
            'description': 'Number of records to skip from start, default: 0',
            'in': 'query',
            'type': 'integer',
          },
          {
            'name': 'limit',
            'description': 'Number of records to return, default: 10',
            'in': 'query',
            'type': 'integer',
          },
          {
            'name': 'query',
            'description': 'MongoDB Query as a well formed JSON String, ie {"name":"Bob"}',
            'in': 'query',
            'type': 'string',
          },
          {
            'name': 'populate',
            'description': 'Path to a MongoDB reference to populate, ie [{"path":"customer"},{"path":"products"}]',
            'in': 'query',
            'type': 'string',
          },
        ],
        'responses': {
          200: {
            'description': `Returns a List of ${name}`,
            'schema': { '$ref': `#/definitions/${name}` },
          },
        },
        'tags': [
          `${name}`,
        ],
      },
      'post': {
        'description': `Creates a new instance of ${name}`,
        'produces': ['application/json'],
        'consumes': ['application/json'],
        'parameters': [{
          'name': name,
          'in': 'body',
          'required': true,
          'schema': { '$ref': `#/definitions/${name}` },
        }],
        'responses': {
          200: {
            'description': `The created instance of ${name}`,
            'schema': { '$ref': `#/definitions/${name}` },
          },
        },
        'tags': [
          `${name}`,
        ],
      },
      'delete': {
        'description': `Deletes the entire contents of collection ${name}`,
        'produces': ['application/json'],
        'responses': {
          200: {
            'description': `Emptied Collection ${name}`,
          },
        },
        'tags': [
          `${name}`,
        ],
      },
    };
    swaggerSpec.paths[`/${name}/{id}`] = {
      'get': {
        'description': `Returns the specified document of type ${name}`,
        'produces': ['application/json'],
        'parameters': [
          {
            'name': 'id',
            'description': 'MongoDB document _id',
            'in': 'path',
            'type': 'string',
            'required': true,
          },
          {
            'name': 'populate',
            'description': 'Path to a MongoDB reference to populate, ie [{"path":"customer"},{"path":"products"}]',
            'in': 'query',
            'type': 'string',
          },
        ],
        'responses': {
          200: {
            'description': `Returns document with requested ID from collection ${name}`,
            'schema': { '$ref': `#/definitions/${name}` },
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
        'produces': ['application/json'],
        'consumes': ['application/json'],
        'parameters': [
          {
            'name': 'id',
            'description': 'MongoDB document _id',
            'in': 'path',
            'type': 'string',
            'required': true,
          },
          {
            'name': name,
            'in': 'body',
            'required': true,
            'schema': { '$ref': `#/definitions/${name}` },
          },
        ],
        'responses': {
          200: {
            'description': `The updated instance of ${name}`,
            'schema': { '$ref': `#/definitions/${name}` },
          },
          404: {
            'description': `No document found with requested ID in collection ${name}`,
          },
        },
        'tags': [
          `${name}`,
        ],
      },
      'patch': {
        'description': 'Partially updates the document with the given ID',
        'produces': ['application/json'],
        'consumes': ['application/json'],
        'parameters': [
          {
            'name': 'id',
            'description': 'MongoDB document _id',
            'in': 'path',
            'type': 'string',
            'required': true,
          },
          {
            'name': name,
            'in': 'body',
            'required': true,
            'schema': { '$ref': `#/definitions/${name}` },
          },
        ],
        'responses': {
          200: {
            'description': `The updated instance of ${name}`,
            'schema': { '$ref': `#/definitions/${name}` },
          },
          404: {
            'description': `No document found with requested ID in collection ${name}`,
          },
        },
        'tags': [
          `${name}`,
        ],
      },
      'delete': {
        'description': 'Deletes the document with the given ID',
        'produces': ['application/json'],
        'parameters': [
          {
            'name': 'id',
            'description': 'MongoDB document _id',
            'in': 'path',
            'type': 'string',
            'required': true,
          },
        ],
        'responses': {
          200: {
            'description': 'Deleted document with given ID',
          },
          404: {
            'description': `No document found with requested ID in collection ${name}`,
          },
        },
        'tags': [
          `${name}`,
        ],
      },
    };
    swaggerSpec.definitions[name] = schema.jsonSchema();
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

