import mongoose from 'mongoose';

const ArtefactSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  isTaken: {
    type: Boolean,
    default: false,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
});

export const Artefact = mongoose.model('Artefact', ArtefactSchema);