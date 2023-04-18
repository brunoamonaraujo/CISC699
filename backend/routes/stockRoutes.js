const express = require("express");
const { predict } = require("../controllers/stockController");
const router = express.Router();

router.post("/predict", predict);

module.exports = router;
