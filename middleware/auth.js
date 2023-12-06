import User from "../models/user.js";
import jwt from "jsonwebtoken";
import { HttpError } from "../helpers/HttpError.js";

import dotenv from "dotenv";
dotenv.config();

const { JWT_SECRET } = process.env;

export const auth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (authorization === undefined) {
    throw HttpError(401, "Not authorized");
  }

  const [bearer, token] = authorization.split(" ", 2);

  if (bearer !== "Bearer") {
    throw HttpError(401, "Not authorized");
  }

  try {
    const { contactId } = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(contactId);

    if (!user || !user.token) {
      throw HttpError(401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(HttpError(401, "Not authorized"));
  }
};
