import { body, param } from "express-validator";
import { validate } from "./auth.validator.js";

export const fileIdValidator = [
  param("fileId").isMongoId().withMessage("Please provide a valid file id"),
  validate,
];

export const grantFileAccessValidator = [
  param("fileId").isMongoId().withMessage("Please provide a valid file id"),

  body("users")
    .isArray({ min: 1 })
    .withMessage("Please provide at least one user to grant access"),

  body("users.*.email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),

  body("users.*.durationInHours")
    .isFloat({ gt: 0 })
    .withMessage("Duration must be greater than 0 hours"),

  body("users.*.canDownload")
    .optional()
    .isBoolean()
    .withMessage("canDownload must be true or false"),

  validate,
];
