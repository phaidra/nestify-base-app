import * as mongoose from 'mongoose';

export const AuthrecSchema = new mongoose.Schema({
  identifier: String,
  retrieved: Date,
  record: mongoose.Schema.Types.Mixed,
});
