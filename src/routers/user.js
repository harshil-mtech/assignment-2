const express = require("express");
const userModel = require("../models/user");
const auth = require("../middleware/auth");

const router = new express.Router();

// User creating endpoint
router.post("/users", async (req, res) => {
  const user = req.body;

  try {
    const createdUser = new userModel(user);
    const token = createdUser.generateAuthToken();

    await createdUser.save();
    res.status(201).send({ createdUser, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// User login endpoint
router.post("/users/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findByCredentials(email, password);
    const token = user.generateAuthToken();

    await user.save();

    res.status(200).send({ user, token });
  } catch (e) {
    if (e.message == "User not found") res.status(404).send(e.message);
    else res.status(400).send(e.message);
  }
});

// User logout endpoint
router.get("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

// User fetching endpoint
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

// User updation endpoint
router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const availableUpdates = ["name", "email", "password"];

  const isValidUpadate = updates.every((update) =>
    availableUpdates.includes(update)
  );

  if (!isValidUpadate)
    return res.status(400).send({ error: "Invalid update operation" });

  updates.forEach((update) => (req.user[update] = req.body[update]));
  await req.user.save();
  res.send(req.user);
});

// User deletion endpoint
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.status(200).send();
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
