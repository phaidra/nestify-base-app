import { HttpAdapterHost } from '@nestjs/core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConverterService } from './converter.service';

import * as _  from 'lodash';
import jsonSchema from 'mongoose-schema-jsonschema';
import restify from 'express-restify-mongoose';
const mongoose = jsonSchema();
import * as fs from 'fs';

@Injectable()
export class SchemasService implements OnModuleInit {
  constructor(private readonly configService: ConfigService,
              private readonly converterService: ConverterService,
              private readonly adapterHost: HttpAdapterHost) {};
  readonly names: string[] = [];
  readonly rawjson: Record<string, any>[] = [];
  readonly schemas: Record<string, any>[] = [];
  readonly models: Record<string, any>[] = [];

  /**
   *
   */
  async onModuleInit() {
    const fn = fs.readdirSync( this.configService.get<string>('schemas.dir') );
    const appinstance = this.adapterHost.httpAdapter;
    //create schemas
    for (let i = 0; i < fn.length; i++) {
      if(/.*\.json/.test(fn[i]) && !/_.*/.test(fn[i])){
        console.log(`initializing schema ${fn[i]}.`);
        const s = JSON.parse(fs.readFileSync(`${this.configService.get<string>('schemas.dir')}/${fn[i]}`, 'utf8'));
        this.rawjson[i] = s;
        this.names[i] = fn[i].split('.')[0];
        this.schemas[i] = new mongoose.Schema(this.converterService.convert(s));
      }
    }

    //create models
    for (let i = 0; i < this.names.length; i ++) {
      if(this.names[i]) {
        console.log(`initializing models for ${this.names[i]}`);
        this.addReverseVirtuals(this.names[i]);
        this.models[i] = mongoose.connections[1].model(this.names[i], this.schemas[i]);
      }
    }

    //restify models
    for (let i = 0; i < this.names.length; i ++) {
      console.log(`restifying models for ${this.names[i]}`);
      if(this.names[i]) {
        restify.serve(appinstance, this.models[i]);
      }
    }
  };

  /**
   *
   * @param baseurl
   */
  public getResObject (baseurl:string) {
    const a = [];
    for (let i = 0; i < this.names.length; i++) {
      if(this.names[i]) a.push({
        type:this.names[i],
        id: `${baseurl}${this.names[i]}`,
        attributes: this.schemas[i].jsonSchema(),
        populateablePaths: this.getPopulateablePathsFromSchemaObject(this.schemas[i].jsonSchema(), []),
        reversePaths: Object.keys(this.schemas[i].virtuals).slice(0, Object.keys(this.schemas[i].virtuals).length-1),
      });
    }
    return a;
  };

  /**
   *
   * @param name
   */
  public jsonSchemaByName (name:string) {
    for (let i = 0; i < this.names.length; i ++) {
      if(name == this.names[i]){
        //we may need put some additional logic here, if front end needs it
        return this.schemas[i].jsonSchema();
      }
    }
    return false;
  };

  public mongooseSchemaArray () {
    const r = [];
    for (let i = 0; i < this.names.length; i ++) {
      r.push({ name: this.names[i], schema: this.schemas[i] });
    }
    return r;
  };

  /**
   *
   * @param name
   */
  private addReverseVirtuals (name: string) {
    const t = {};
    const s = this.schemas[this.names.indexOf(name)];
    for (let i = 0; i < this.names.length; i ++) {
      if(this.names[i]){
        t[this.names[i]] = this.getPopulateablePathsFromSchemaObject(this.schemas[i].jsonSchema(), [])
          .filter(p => p.target === name)
          .map(p => p.path);
      }
    }
    for(const key in t) {
      t[key].forEach((p) => {
        s.virtual(`${key}_${p.replace(/\./, '_')}`, {
          ref: key,
          localField: '_id',
          foreignField: p
        });
      })
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

