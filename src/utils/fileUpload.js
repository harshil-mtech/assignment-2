const multer = require("multer");
const { nanoid } = require("nanoid");
const inventoryModel = require("../models/inventory");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(undefined, "./images");
  },
  async filename(req, file, cb) {
    if (req.params.id) {
      const inventory = await inventoryModel.findById(req.params.id);
      if (inventory) {
        return cb(undefined, inventory.image);
      } else return cb(new Error("Inventory not found"));
    }
    const name = nanoid() + ".png";
    req.body.image = name;
    cb(undefined, name);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|jpeg)/)) {
      return cb(new Error("Please upload a valid image"));
    }

    cb(undefined, true);
  },
});

module.exports = upload;
