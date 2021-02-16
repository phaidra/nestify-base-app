import * as mongoose from 'mongoose';

export const AssetsSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 5,
    maxlength: 255,
    required: [true, 'NAME_IS_BLANK'],
  },
  identifier: {
    type: Array,
  },
  source: {
    type: String,
  },
  originalname: {
    type: String,
  },
  size: {
    type: Number
  },
  mimetype: {
    type: String,
  },
  __lastAccessedBy: {
    type: String
  },
  __lastAccessedIn: {
    type: Date
  },
})
