import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // counter name, e.g., 'productNumber'
  seq: { type: Number, default: 0 },
});

// Single model to track all counters via different _id values
const Counter = mongoose.model("Counter", counterSchema);

export default Counter;
