import * as mongoose from 'mongoose';

const LabelSchema = new mongoose.Schema({
  label: { type: String },
  language: { type: String, enum: ['de', 'en', 'fr', 'xx'] },
});

export const ConceptSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: [true, 'IDENTIFIER_IS_BLANK'],
  },
  prefLabel: [
    {
      type: LabelSchema,
    },
  ],
  altLabel: [
    {
      type: LabelSchema,
    },
  ],
  hiddenLabel: [
    {
      type: LabelSchema,
    },
  ],
  broader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Concept',
  },
  narrower: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Concept',
    },
  ],
  related: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Concept',
    },
  ],
  scopeNote: String,
  definition: String,
  example: String,
  historyNote: String,
  editorialNote: String,
  changeNote: String,
  exactMatch: String,
  authRec: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Authrec',
    },
  ],
});
