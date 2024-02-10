import express from "express";
import { isValidObjectId, startSession } from "mongoose";
import Joi from "joi";
import Contact from "../../models/contacts.js";
import { HttpError } from "../../helpers/HttpError.js";
import { auth } from "../../middleware/auth.js";

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

router.get("/", auth, async (req, res, next) => {
  try {
    const { _id: owner } = req.user;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const result = await Contact.find({ owner }, "", { skip, limit }).populate(
      "owner",
      "email subscription"
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/:contactId", auth, async (req, res, next) => {
  try {
    const { _id: owner } = req.user;

    const { contactId } = req.params;

    const result = await Contact.findOne({ _id: contactId, owner });

    if (!result) {
      throw HttpError(
        404,
        `Contact with this id not found in your contact list`
      );
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/", auth, async (req, res, next) => {
  try {
    if (!Object.keys(req.body).length) {
      throw HttpError(400, "Missing required  fields");
    }

    const { error } = contactAddSchema.validate(req.body);

    if (error) {
      throw HttpError(400, error.message);
    }

    const { _id: owner } = req.user;

    const result = await Contact.create({ ...req.body, owner });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/:contactId", auth, async (req, res, next) => {
  try {
    const { _id: owner } = req.user;
    const { contactId } = req.params;

    const result = await Contact.findOneAndDelete({ _id: contactId, owner });

    if (!result) {
      throw HttpError(
        404,
        `Contact with this id not found in your contact list`
      );
    }

    res.json({ message: "Contact deleted" });
  } catch (error) {
    next(error);
  }
});

router.put("/:contactId", auth, async (req, res, next) => {
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

    const { _id: owner } = req.user;

    const result = await Contact.findByIdAndUpdate(
      { _id: contactId, owner },
      req.body,
      {
        new: true,
      }
    );

    if (!result) {
      throw HttpError(
        404,
        `Contact with this id not found in your contact list`
      );
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

    const result = await Contact.findOneAndUpdate(
      { contactId, owner },
      req.body
    );

    if (!result) {
      throw HttpError(404, `Contact with ${contactId} not found`);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
