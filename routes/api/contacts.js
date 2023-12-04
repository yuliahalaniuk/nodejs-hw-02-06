import express from "express";
import Contact from "../../models/contacts.js";
import { isValidObjectId } from "mongoose";
import Joi from "joi";

const router = express.Router();

const contactAddSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": `"name" required field`,
  }),
  email: Joi.string().email().required().messages({
    "any.required": `"email" required field`,
  }),
  phone: Joi.string().required().messages({
    "any.required": `"phone" required field`,
  }),
  favorite: Joi.boolean(),
});
const contactUpdateSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string().email(),
  phone: Joi.string(),
}).or("name", "email", "phone");

const contactUpdateFavoriteSchema = Joi.object({
  favorite: Joi.boolean().required(),
});

const HttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

router.get("/", async (req, res, next) => {
  try {
    const result = await Contact.find();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;

    if (!isValidObjectId(contactId)) {
      throw HttpError(404, `${contactId} not valid id`);
    }

    const result = await Contact.findById(contactId);

    if (!result) {
      throw HttpError(404, `Contact with id: ${contactId}  not found`);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!Object.keys(req.body).length) {
      throw HttpError(400, "Missing required  fields");
    }

    const { error } = contactAddSchema.validate(req.body);

    if (error) {
      throw HttpError(400, error.message);
    }

    const result = await Contact.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;

    if (!isValidObjectId(contactId)) {
      throw HttpError(404, `${contactId} not valid id`);
    }

    const result = await Contact.findByIdAndDelete(contactId);
    if (!result) {
      throw HttpError(404, `Contact with ${contactId} not found`);
    }
    res.json({
      message: "Contact deleted",
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;

    if (!isValidObjectId(contactId)) {
      throw HttpError(404, `${contactId} not valid id`);
    }
    if (!Object.keys(req.body).length) {
      throw HttpError(400, "missing fields");
    }

    const { error } = contactUpdateSchema.validate(req.body);

    if (error) {
      throw HttpError(400, error.message);
    }

    const result = await Contact.findByIdAndUpdate(contactId, req.body, {
      new: true,
    });
    if (!result) {
      throw HttpError(404, `Contact with ${contactId} not found`);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.patch("/:contactId/favorite", async (req, res, next) => {
  try {
    const { contactId } = req.params;

    if (!isValidObjectId(contactId)) {
      throw HttpError(404, `${contactId} not valid id`);
    }

    const { error } = contactUpdateFavoriteSchema.validate(req.body);

    if (error) {
      throw HttpError(400, error.message);
    }

    const result = await Contact.findByIdAndUpdate(contactId, req.body);

    if (!result) {
      throw HttpError(404, `Contact with ${contactId} not found`);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
