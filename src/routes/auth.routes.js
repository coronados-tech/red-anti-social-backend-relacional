const express = require("express");
const router = express.Router();
const { login, me } = require("../controllers/auth.controller");
const { loginSchema } = require("../schemas/auth.schema");
const schemaValidatorMiddleware = require("../middlewares/validations/schema.middleware");
const { requireAuthMiddleware } = require("../middlewares/auth.middleware");

router.post("/login", schemaValidatorMiddleware(loginSchema), login);
router.get("/me", requireAuthMiddleware, me);

module.exports = router;
