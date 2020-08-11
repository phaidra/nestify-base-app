import { Document } from 'mongoose';

export interface Assetref extends Document {
  name: string;
  identifier: [string];
  source: string;
  path: string;
  mimetype: string;
  __lastAccessedBy: string;
  __lastAccessedIn: Date;
}
