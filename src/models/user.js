const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "name should be required"],
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: [true, "email should be required"],
    trim: true,
    lowercase: true,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) throw new Error("Invalid Email");
    },
  },
  password: {
    type: String,
    required: [true, "password is required"],
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
});

userSchema.virtual("inventories", {
  ref: "inventory",
  localField: "_id",
  foreignField: "owner",
});

// Method added to user Document
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, "secretKey");

  this.tokens.push({ token });

  return token;
};

// Method added to user Model
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await userModel.findOne({ email });

  if (user === null) {
    throw new Error("User not found");
  }

  const isValidPassword =
    password && (await bcrypt.compare(password, user.password));
  if (!isValidPassword) throw new Error("Incorrect password");

  return user;
};

// To hash the plain text password
userSchema.pre("save", async function (next) {
  if (this.isModified("password"))
    this.password = await bcrypt.hash(this.password, 8);
  next();
});

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
