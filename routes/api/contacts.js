import express from "express";
import Joi from "joi";
import {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
} from "../../models/contacts.js";

const HttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const router = express.Router();

const contactsAddSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
  phone: Joi.number().required(),
});

router.get("/", async (req, res, next) => {
  try {
    const result = await listContacts();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;

    const result = await getContactById(contactId);

    if (!result) {
      throw HttpError(404, `Contact with ${contactId} id not found`);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!Object.keys(req.body).length) {
      throw HttpError(400, "Missing required name field");
    }

    const { error } = contactsAddSchema.validate(res.body);

    if (error) {
      throw HttpError(400, error.message);
    }

    const result = await addContact(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;

    const result = await removeContact(contactId);

    if (!result) {
      throw HttpError(404, `Contact with ${contactId} id not found`);
    }

    res.json({ message: "Contact deleted" });
  } catch (error) {
    next(error);
  }
});

router.put("/:contactId", async (req, res, next) => {
  try {
    if (!Object.keys(req.body).length) {
      throw HttpError(400, "Fields empty");
    }

    const { error } = contactsAddSchema.validate(res.body);

    if (error) {
      throw HttpError(400, error.message);
    }

    const { contactId } = req.params;

    const result = await updateContact(contactId, req.body);

    if (!result) {
      throw HttpError(404, `Contact with ${contactId} id not found`);
    }
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
