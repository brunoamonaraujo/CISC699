const express = require("express");
const router = express.Router();
const { createUser, login, updateUser } = require("../controllers/userController");

router.post("/", createUser);
router.post("/login", login);
router.put("/", updateUser);

module.exports = router;
