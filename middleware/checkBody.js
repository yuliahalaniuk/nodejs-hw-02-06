import { HttpError } from "../helpers/HttpError.js";

const checkBody = (req, _, next) => {
  if (!Object.keys(req.body).length) {
    return next(HttpError(400, "Missing required field"));
  }
  next();
};

export default checkBody;
