import multer from "multer";
import path from "path";

import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";

const storage = multer.memoryStorage();
const FILE_LIMIT_SIZE = 2 * 1024 * 1024;

const imgFilter = (req, file, callback) => {
  let extFile = path.extname(file.originalname);
  if (extFile === ".png" || extFile === ".jpg" || extFile === ".jpeg") return callback(null, true);
  callback(null, false);
  callback(new APIError(API_STATUS_CODE.BAD_REQUEST, "Filetype must be PNG/JPG/JPEG"));
};

const upload = multer({
  storage: storage,
  fileFilter: imgFilter,
  limits: {
    fileSize: FILE_LIMIT_SIZE,
  },
}).single("image");

export const imgUploader = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return next(new APIError(API_STATUS_CODE.BAD_REQUEST, err.message));
    } else if (err) {
      return next(err);
    }
    next();
  });
};
