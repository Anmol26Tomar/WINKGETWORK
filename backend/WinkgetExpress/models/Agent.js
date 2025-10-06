const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v); // exactly 10 digits
      },
      message: (props) => `${props.value} is not a valid 10-digit phone number!`,
    },
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  vehicleType: {
    type: String,
    enum: ["bike", "cab", "truck"],
    required: true,
    trim: true,
  },
  vehicleSubType: {
    type: String,
    trim: true,
  },
  serviceType: {
    type: String,
    enum: ["intra-city", "inter-city"],
    required: true,
    validate: {
      validator: function (v) {
        // Fix: match enum values exactly
        if (this.vehicleType === "bike" && v !== "intra-city") {
          return false;
        }
        return true;
      },
      message: "Bike can only select intra-city service",
    },
  },
  password: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Agent", agentSchema);
