const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password (or fallback for existing plain text)
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  // If password was hashed with bcrypt ($2a$, $2b$, $2y$)
  if (this.password.startsWith("$2")) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
  // Backwards compatibility for existing plain text accounts
  return this.password === enteredPassword;
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
