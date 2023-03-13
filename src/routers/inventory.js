const path = require("path");
const fs = require("fs");
const express = require("express");
const moment = require("moment-timezone");
const auth = require("../middleware/auth");
const inventoryModel = require("../models/inventory");
const saveTime = require("../utils/saveTime");
const upload = require("../utils/fileUpload");

const router = new express.Router();

// Inventory creation endpoint
router.post("/inventory", auth, upload.single("image"), async (req, res) => {
  try {
    const inventory = req.body;

    saveTime(inventory, "manufacturingTime", inventory.timeZone);
    saveTime(inventory, "expiryTime", inventory.timeZone);

    inventory.owner = req.user._id;

    const createdInvetory = new inventoryModel(inventory);
    await createdInvetory.save();
    res.send(createdInvetory);
  } catch (e) {
    console.log(e);
    return res.status(400).send(e);
  }
});

// Inventory fetching endpoint
// GET /inventories?name=inv1&category=Other
// GET /inventories?limit=2&skip=2
// GET /inventories?sortBy=expiryTime:asc
// GET /inventories?timeZone=America/Los_Angeles
router.get("/inventories", auth, async (req, res) => {
  const match = {};
  if (req.query.name) match.name = req.query.name;
  if (req.query.category) match.category = req.query.category;

  const sort = {};
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "asc" ? 1 : -1;
  }

  const inventories = await inventoryModel.find(match, null, {
    limit: parseInt(req.query.limit),
    skip: parseInt(req.query.skip),
    sort,
  });

  const isValidTimeZone = moment.tz.names().includes(req.query.timeZone);

  // populating owner details in inventories and changing time according to given timezone
  for (let i = 0; i < inventories.length; i++) {
    inventories[i] = await inventories[i].populate("owner");

    if (isValidTimeZone) {
      inventories[i] = inventories[i].toObject();

      inventories[i].manufacturingTime = moment
        .tz(inventories[i].manufacturingTime, req.query.timeZone)
        .format();

      inventories[i].expiryTime = moment
        .tz(inventories[i].expiryTime, req.query.timeZone)
        .format();
    }
  }
  res.send(inventories);
});

// Inventory updation endpoint
// PATCH /inventory/:id?timeZone=Asia/Kolkata
router.patch(
  "/inventory/:id",
  auth,
  upload.single("image"),
  async (req, res, next) => {
    const user = req.user;
    const inventory = await inventoryModel.findById(req.params.id);

    if (inventory && inventory.owner.toString() == user._id.toString()) {
      const updates = Object.keys(req.body);
      const allowedUpdates = [
        "name",
        "category",
        "quantity",
        "manufacturingTime",
        "expiryTime",
      ];

      const filterUpdates = updates.filter((update) =>
        allowedUpdates.includes(update)
      );

      filterUpdates.forEach((update) => (inventory[update] = req.body[update]));

      if (filterUpdates.manufacturingTime)
        saveTime(inventory, "manufacturingTime", req.query.timeZone);
      if (filterUpdates.expiryTime)
        saveTime(inventory, "expiryTime", req.query.timeZone);

      inventory.save();
      res.send(inventory);

      next();
    } else res.status(404).send();
  }
);

// Inventory Deletion endpoint
// DELETE /inventory/:id
router.delete("/inventory/:id", auth, async (req, res) => {
  try {
    const user = req.user;
    const match = { _id: req.params.id };
    await user.populate({ path: "inventories", match });

    const inventory = user.inventories[0];
    await inventory.remove();
    res.send(inventory);
  } catch (e) {
    res.status(404).send();
  }
});

router.delete("/inventories", auth, async (req, res) => {
  try {
    await req.user.populate("inventories");
    const inventories = req.user.inventories;
    inventories.forEach(async (inventory) => await inventory.remove());
    res.status(200).send();
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

// GET /image?name=kd.png
router.get("/inventory/image", async (req, res) => {
  const imagePath = path.join(__dirname, "../../images", req.query.name);
  const imageBuffer = fs.readFileSync(imagePath);

  res.set("Content-Type", "image/png");
  res.send(imageBuffer);
});

module.exports = router;
