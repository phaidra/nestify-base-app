import { Injectable } from '@nestjs/common';
import * as mongoose from 'mongoose';
import * as _ from 'lodash';

@Injectable()
export class ConverterService {
  private hash: Record<string, any> = {
    validator: {},
    setter: {},
    getter: {},
    default: {},
  };

  /**
   * Creates functions specialized in registering custom validators, setters,
   * getters and defaults.
   * @param {String} param - one of 'validator', 'setter', 'getter', 'default'
   * @throws Error
   * @return {Function}
   */
  set(param: string) {
    return (key, value) => {
      switch (param) {
        case 'validator':
          this.hash.validator[key] = value;
          break;
        case 'setter':
          this.hash.setter[key] = value;
          break;
        case 'getter':
          this.hash.getter[key] = value;
          break;
        case 'default':
          this.hash.default[key] = value;
          break;
      }
    };
  }

  /**
   * Returns a previously registered function.
   * @param {String} param - one of 'validator', 'setter', 'getter', 'default'
   * @param {String} key - the name under which the value was registered.
   * @throws Error
   * @return {Function}
   */
  get(param: string, key: string) {
    const fn = this.hash && this.hash[param] && this.hash[param][key];
    if (!fn) {
      throw new Error('Unregistered "' + param + '" with name "' + key + '"');
    }
    return fn;
  }

  /**
   * Converts type names into actual types supported by mongoose.
   * @param {String} type - one of 'string', 'number', 'boolean',
   *                               'date', 'buffer', 'objectid', 'mixed'
   * @throws Error
   * @return {Object}
   */
  matchType(type: string) {
    const types = {
      array: Array,
      buffer: Buffer,
      boolean: Boolean,
      date: Date,
      mixed: mongoose.Schema.Types.Mixed,
      number: Number,
      objectid: mongoose.Schema.Types.ObjectId,
      string: String,
      object: Object,
    };
    if (types[type.toLowerCase()]) {
      return types[type.toLowerCase()];
    }
    throw new Error('unknown type ' + type);
  }

  /**
   * Function verifies that `value` is a valid parameter of RegExp constructor.
   * @param {String} type
   * @param {String} value
   * @throws Error
   * @return {RegExp}
   */
  check(type: string, value: string) {
    if (type === 'match') {
      if (!_.isString(value)) {
        throw new Error('expected string for match key');
      }
      return new RegExp(value);
    }
    throw new Error('unexpected type ' + type);
  }

  /**
   * Converts a plain json schema definition into a mongoose schema definition.
   *
   * @param {Object} descriptor
   * @return {Object}
   */
  convert(descriptor: Record<string, any>) {
    const encoded: string = JSON.stringify(descriptor);
    const decoded: Record<string, any> = JSON.parse(encoded, (key, value) => {
      if (key === 'type' && typeof value !== 'object') {
        return this.matchType(value);
      }
      if (key === 'validate') {
        return this.get('validator', value);
      }
      if (key === 'get') {
        return this.get('getter', value);
      }
      if (key === 'set') {
        return this.get('setter', value);
      }
      if (key === 'default') {
        return this.get('default', value);
      }
      if (key === 'match') {
        return this.check(key, value);
      }
      if (key === '') {
        return value;
      }
      return value;
    });
    return decoded;
  }
}
