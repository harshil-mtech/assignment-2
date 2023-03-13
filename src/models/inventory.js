const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: {
      values: [
        "Raw Materials",
        "Work-In-Process",
        "Finished Goods",
        "Overhaul",
        "Other",
      ],
      message: "{VALUE} is not supported",
    },
    default: "Other",
    required: true,
  },
  image: {
    type: Buffer,
  },
  quantity: {
    type: Number,
    required: true,
  },
  manufacturingTime: {
    type: Date,
  },
  expiryTime: {
    type: Date,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },
  image: {
    type: String,
  },
});

inventorySchema.pre("remove", async function (next) {
  const imagePath = path.join(__dirname, "../../images", this.image);

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  next();
});

const inventoryModel = mongoose.model("inventory", inventorySchema);

module.exports = inventoryModel;
