import * as mongoose from 'mongoose';

export interface Authrec extends mongoose.Document {
  identifier: string;
  retrieved: Date;
  record: Record<any, any>;
}
