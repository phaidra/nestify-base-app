import * as mongoose from 'mongoose';

export const ConceptSchema = new mongoose.Schema({
  identifier: String,
  retrieved: Date,
  record: mongoose.Schema.Types.Mixed,
});
