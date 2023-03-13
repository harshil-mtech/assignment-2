const jwt = require("jsonwebtoken");
const userModel = require("../models/user");

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.replace("Bearer ", "");

    const user = await userModel.find({ "tokens.token": token });
    if (user.length === 0) throw new Error("User not found");

    req.user = user[0];

    next();
  } catch (e) {
    res.status(401).send({ error: "please authenticate" });
  }
};

module.exports = auth;
