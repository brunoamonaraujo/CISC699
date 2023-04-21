const express = require("express");
const router = express.Router();
const {
  createUser,
  login,
  updateUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");

router.post("/", createUser);
router.put("/", updateUser);
router.post("/login", login);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword", resetPassword);

module.exports = router;
