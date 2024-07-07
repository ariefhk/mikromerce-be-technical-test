import { cloudinary } from "../application/cloudinary.js";
import { APIError } from "../error/api.error.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import path from "path";

export class CloudinaryService {
  static getPublicId(imageUrl) {
    if (!imageUrl) return "";

    const CLOUDINARY_REGEX =
      /^.+\.cloudinary\.com\/(?:[^\/]+\/)(?:(image|video|raw)\/)?(?:(upload|fetch|private|authenticated|sprite|facebook|twitter|youtube|vimeo)\/)?(?:(?:[^_/]+_[^,/]+,?)*\/)?(?:v(\d+|\w{1,2})\/)?([^\.^\s]+)(?:\.(.+))?$/;

    const parts = CLOUDINARY_REGEX.exec(imageUrl);

    return parts && parts.length > 2 ? parts[parts.length - 2] : imageUrl;
  }

  static async uploadImage(file, folder = "mikromerce") {
    try {
      const fileBase64 = file.buffer.toString("base64"); //convert buffer to base64
      const fileData = `data:${file.mimetype};base64,${fileBase64}`;
      const originalFilename = path.parse(file.originalname).name;
      const imgPayload = await cloudinary.uploader.upload(fileData, {
        folder,
        public_id: originalFilename,
      });

      return imgPayload.secure_url;
    } catch (error) {
      console.log("CLOUDINARY UPLOAD ERROR", error);
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, error.message);
    }
  }

  static async deleteImage(imageUrl) {
    try {
      const publicId = this.getPublicId(imageUrl);
      const deleteImage = await cloudinary.uploader.destroy(publicId);

      return deleteImage;
    } catch (error) {
      console.log("CLOUDINARY DELETE ERROR", error);
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, error.message);
    }
  }
}
