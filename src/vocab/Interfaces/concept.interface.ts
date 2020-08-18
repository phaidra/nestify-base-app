import * as mongoose from 'mongoose';

export interface Label {
  label: string,
  language: "de" | "en" | "fr" | "xx",
}

export interface Concept extends mongoose.Document {
  identifier: string,
  prefLabel?: [Label],
  altLabel: [Label],
  hiddenLabel: [Label],
  broader: mongoose.Schema.Types.ObjectId,
  narrower: [mongoose.Schema.Types.ObjectId],
  related: [mongoose.Schema.Types.ObjectId],
  scopeNote: string,
  definition: string,
  example: string,
  historyNote: string,
  editorialNote: string,
  changeNote: string,
  exactMatch: string
  authRec: mongoose.Schema.Types.ObjectId,
}
