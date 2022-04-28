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
import { Model, Schema, Connection, Types } from 'mongoose';
import { User } from '../user/interfaces/user.interface';
import { NextFunction, Request, Response } from 'express';
import { parse } from 'json2csv';


const ftiConfig = {
  'entry': [
    { path: 'name' },
    { path: 'originalTitle' },
    { path: 'transscription'},
    { path: 'creator.id', target: 'actor' },
    { path: 'material', target: 'descriptor' },
    { path: 'technique', target: 'descriptor' },
    { path: 'partOf', target: 'collect' },
    { path: 'classification.descriptor', target: 'descriptor' },
    { path: 'place', target: 'descriptor' }
  ],
  'collect': [
    { path: 'name'},
    { path: 'creator.id', target: 'actor' },
    { path: 'place', target: 'descriptor' },
    { path: 'time', target: 'descriptor' },
    { path: 'classification.descriptor', target: 'descriptor' },
    { path: 'description', target: 'descriptor'}
  ]
}

const csvConfig = {
  fields: [
    {
        label: 'Name',
        value: `name`,
    },
  ],
  defaultValue: '-',
  delimiter: ',',
  excelStrings: true,
  withBOM: true,
  transforms: [
    (item) => ({ ...item, school1: item.classification ? item.classification.filter(c => _.get(c, 'aspect.name') === 'Schule')[0] : null}),
    (item) => ({ ...item, school2: item.classification ? item.classification.filter(c => _.get(c, 'aspect.name') === 'Schule')[1] : null}),
    (item) => ({ ...item, school3: item.classification ? item.classification.filter(c => _.get(c, 'aspect.name') === 'Schule')[2] : null}),
    (item) => ({ ...item, daterange1: item.classification ? item.classification.filter(c => _.get(c, 'aspect.name') === 'Datierung')[0] : null}),
    (item) => ({ ...item, daterange2: item.classification ? item.classification.filter(c => _.get(c, 'aspect.name') === 'Datierung')[1] : null}),
    (item) => ({ ...item, daterange3: item.classification ? item.classification.filter(c => _.get(c, 'aspect.name') === 'Datierung')[2] : null}),
    (item) => ({ ...item, subject1: item.classification ? item.classification.filter(c => _.get(c, 'aspect.name') === 'Thema')[0] : null}),
    (item) => ({ ...item, subject2: item.classification ? item.classification.filter(c => _.get(c, 'aspect.name') === 'Thema')[1] : null}),
    (item) => ({ ...item, subject3: item.classification ? item.classification.filter(c => _.get(c, 'aspect.name') === 'Thema')[2] : null}),
    (item) => ({ ...item, type1: item.classification ? item.classification.filter(c => _.get(c, 'aspect.name') === 'Kunstgattung')[0] : null}),
    (item) => ({ ...item, type2: item.classification ? item.classification.filter(c => _.get(c, 'aspect.name') === 'Kunstgattung')[1] : null}),
    (item) => ({ ...item, type3: item.classification ? item.classification.filter(c => _.get(c, 'aspect.name') === 'Kunstgattung')[2] : null}),
  ]
};
const csvExportFields = {
  entry: [
  {
    label: 'Name',
    value: `name`,
  },
  {
    label: 'Original Title',
    value: `originalTitle`,
  },
  {
    label: 'Transcription',
    value: `transscription`,
  },
  {
    label: 'Provenance',
    value: `provinience`,
  },
  {
    label: 'Technique',
    value: `technique.0.name`,
  },
  {
    label: 'Material',
    value: `material.0.name`,
  },
  {
    label: 'Object Type',
    value: `type1.descriptor.name`,
  },
  {
    label: 'Object Type',
    value: `type2.descriptor.name`,
  },
  {
    label: 'Object Type',
    value: `type3.descriptor.name`,
  },
  {
    label: 'Subject',
    value: `subject1.descriptor.name`,
  },
  {
    label: 'Subject',
    value: `subject2.descriptor.name`,
  },
  {
    label: 'Subject',
    value: `subject3.descriptor.name`,
  },
  {
    label: 'Data Range',
    value: `daterange1.descriptor.name`,
  },
  {
    label: 'Data Range',
    value: `daterange2.descriptor.name`,
  },
  {
    label: 'Data Range',
    value: `daterange3.descriptor.name`,
  },
  {
    label: 'School',
    value: `school1.descriptor.name`,
  },
  {
    label: 'School',
    value: `school2.descriptor.name`,
  },
  {
    label: 'School',
    value: `school3.descriptor.name`,
  },
  {
    label: 'Creator Name',
    value: `creator.0.id.name`,
  },
  {
    label: 'Creator Name',
    value: `creator.1.id.name`,
  },
  {
    label: 'Creator Name',
    value: `creator.2.id.name`,
  },
  {
    label: 'Relations Target Name',
    value: `relations.0.target.name`,
  },
  {
    label: 'Relations Target Name',
    value: `relations.1.target.name`,
  },
  {
    label: 'Transaction (Inbound) - Type',
    value: `acquisition_type.name`,
  },
  {
    label: 'Place',
    value: `place.0.name`,
  },
  {
    label: 'Transaction (Inbound) - Date',
    value: `acquisition_ref.date`,
  },
  {
    label: 'Transaction (Inbound) - Price',
    value: `acquisition_ref.price[0].amount`,
  },
  {
    label: 'Transaction (Inbound) - currency',
    value: `acquisition_ref.price[0].currency.name`,
  },
  {
    label: 'Transaction (Inbound) - Type',
    value: `acquisition_type.name`,
  },
  {
    label: 'Transaction (Inbound) - Estimate Price',
    value: `acquisition_est[0].amount`,
  },
  {
    label: 'Transaction (Inbound) - Estimate Currency',
    value: `acquisition_est[0].currency.name`,
  },
  {
    label: 'Transaction (Outbound) - Date',
    value: `destitution_ref.date`,
  },
  {
    label: 'Transaction (Outbound) - Price',
    value: `destitution_ref.price[0].amount`,
  },
  {
    label: 'Transaction (Outbound) - currency',
    value: `destitution_ref.price[0].currency.name`,
  },
  {
    label: 'Transaction (Outbound) - Estimate Price',
    value: `destitution_est[0].amount`,
  },
  {
    label: 'Transaction (Outbound) - Estimate Currency',
    value: `destitution_est[0].currency.name`,
  },
],
  actor: [
    {
      label: 'Name',
      value: `name`,
    },
    {
      label: 'Description',
      value: `description`,
    },
    {
      label: 'Identifier',
      value: `identifier.0`,
    },
    {
      label: 'Identifier',
      value: `identifier.1`,
    },
    {
      label: 'Identifier',
      value: `identifier.2`,
    },
    {
      label: 'Begin of Existence',
      value: `beginOfExistence`,
    },
    {
      label: 'End of Existence',
      value: `endOfExistence`,
    },
  ],
}


@Injectable()
export class SchemasService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly converterService: ConverterService,
    private readonly adapterHost: HttpAdapterHost,
    private readonly authService: AuthService,
    @InjectModel('_User') private readonly userModel: Model<User>,
  ) {};

  public json: Record<string, any>[] = [];
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
      this.json[i] = s;
      schemalist[i] = new mongoose.Schema(this.converterService.convert(s), { versionKey: false });
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
        preCreate: [this.authService.validateUserExternal, this.createFtiField],
        preUpdate: [this.authService.validateUserExternal, this.createFtiField],
        preDelete: [this.authService.validateUserExternal],
        postRead: [this.exportCSV],
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
        '@id': `${baseurl}${this.names[i]}`,
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

  private exportCSV(req: any, res: Response, next: NextFunction) {
    if(req.query.export === "csv") {
      const entity = _.last(req.path.split('/'));
      if (Array.isArray(csvExportFields[entity])) csvConfig.fields = csvExportFields[entity];
      try {
        const csv = parse(req.erm.result, csvConfig);
        res.setHeader('content-type', 'text/csv');
        res.send(csv);
      } catch (err) {
        console.error(err);
      }
    } else next();
  };

  /**
   * used in presave hooks to create/update the full text normalisation field
   * TODO: paths should come from configservice, wich is currently not available in
   * presave hooks
   * TODO: this assumes that the record submitted to be saved is fully populated (wich is usually the case when it's
   * edited) to make the API resilient, it should check population beforehand and populate if need be
   * @param req
   * @param res
   * @param next
   * @private
   */
  private createFtiField(req: Request, res: Response, next: NextFunction) {
    const name = req.originalUrl.split('/')[3];
    const paths = ftiConfig[name];
    if(paths) {
      const aggregation = [];
      paths.forEach(path => {
        if(path.path && path.target) {
          if(path.path.split('.').length > 1) {
            console.log(req.body, path.path.split('.'));
            aggregation.push(req.body[path.path.split('.')[0]].reduce(function (a, c) {
              return `${a} ${c[path.path.split('.')[1]].name}`
            }, ''));
          }
          else _.get(req.body, `${path.path}.name`);
        }
        else if(path.path) {
          aggregation.push(
            _.get(req.body, path.path)
          );
        }
      });
      req.body.fti = aggregation.join(' ')
        .normalize("NFD") //decompose combined graphemes
        .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\r\n\{\}\[\]\\\/]/gi, '') //remove special chars
        .replace(/[\u0300-\u036f]/g, ""); //remove diacritics
    }
    next();
  }

  /**
   * bulk update for full text normalisation field, requires memory limits to be manually set for larger collections
   * TODO: the time of the last run should be saved, so it can be ran at regular intervals
   * @param name
   */
  public async bulkFtiUpdate(name: string) {
    const paths = ftiConfig[name]
    const m = this.models[this.names.indexOf(name)]
    if(paths) {
      const records = await m.find();
      let i = 1;
      const ppaths = this.getPopulateablePathsFromSchemaObject(this.schemas[this.names.indexOf(name)].jsonSchema(), []).reduce(function (a,c) { return `${a} ${c.path}` },'');
      console.log(`bulk update for collection ${name} - writing ${records.length} records to database.`)
      records.forEach((r) => {
       m.findOne({_id: r._id})
         .populate(ppaths)
         .exec( (err, rec) => {
             if (err) return (err);
             const aggregation = [];
             paths.forEach((path) => {
               if(path.path && path.target) {
                 if(path.path.split('.').length > 1) {
                   aggregation.push(rec[path.path.split('.')[0]].reduce(function (a, c) {
                     if (c[path.path.split('.')[1]]) return `${a} ${c[path.path.split('.')[1]].name}`;
                     else return a;
                   }, ''));
                 }
                 else _.get(rec, `${path.path}.name`);
               }
               else if(path.path) {
                 aggregation.push(
                   _.get(rec, path.path)
                 );
               }
             });
            rec.fti = aggregation.join(' ')
              .normalize("NFD") //decompose combined graphemes
              .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\r\n\{\}\[\]\\\/]/gi, '') //remove special chars
              .replace(/[\u0300-\u036f]/g, ""); //remove diacritics
            rec.save();
            i = i+1;
          });
      })
      console.log(`bulk update for collection ${name} - DONE writing ${records.length} records to database.`)
    }
    return;
  }

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
    swaggerDoc.components.schemas.error = {
      type: 'object',
      properties: {
        error: {
          type: 'string'
        },
      },
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
          {
            'name': 'export',
            'description': 'export format, if desired',
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
              'text/csv': {
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
          201: {
            'description': `The created instance of ${name}`,
            'content':{
              'application/json': {
                'schema': { '$ref': `#/components/schemas/${name}` },
              },
            },
          },
          401: {
            'description': `Authorization failure.`,
            'content':{
              'application/json': {
                'schema': { '$ref': `#/components/schemas/error` },
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
          401: {
            'description': `Authorization failure.`,
            'content':{
              'application/json': {
                'schema': { '$ref': `#/components/schemas/error` },
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
          401: {
            'description': `Authorization failure.`,
            'content':{
              'application/json': {
                'schema': { '$ref': `#/components/schemas/error` },
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
          401: {
            'description': `Authorization failure.`,
            'content':{
              'application/json': {
                'schema': { '$ref': `#/components/schemas/error` },
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
          401: {
            'description': `Authorization failure.`,
            'content':{
              'application/json': {
                'schema': { '$ref': `#/components/schemas/error` },
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
