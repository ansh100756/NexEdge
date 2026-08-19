import mongoose from "mongoose";

const edgeServerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  city: {
    type: String,
    required: true
  },

  latitude: {
    type: Number,
    required: true
  },

  longitude: {
    type: Number,
    required: true
  },

  baseUrl: {
    type: String,
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  }
});

export default mongoose.model("EdgeServer", edgeServerSchema);