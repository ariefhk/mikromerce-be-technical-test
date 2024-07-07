import { ResponseHelper } from "../helper/response.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";
import { CategoryService } from "../service/category.service.js";

export class CategoryController {
  static async getAll(req, res, next) {
    try {
      const getAllCategoryRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req?.query?.name,
      };

      const result = await CategoryService.getAll(getAllCategoryRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success get all category", result));
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const registerCategoryRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req.body.name,
      };

      const result = await CategoryService.create(registerCategoryRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success create category", result));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updateCategoryRequest = {
        loggedUserRole: req?.loggedUser?.role,
        name: req.body.name,
        categoryId: req.params.categoryId ? Number(req.params.categoryId) : null,
      };

      const result = await CategoryService.update(updateCategoryRequest);

      return res.status(API_STATUS_CODE.CREATED).json(ResponseHelper.toJson("Success update category", result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const deleteCategoryRequest = {
        loggedUserRole: req?.loggedUser?.role,
        categoryId: req.params.categoryId ? Number(req.params.categoryId) : null,
      };

      await CategoryService.delete(deleteCategoryRequest);

      return res.status(API_STATUS_CODE.OK).json(ResponseHelper.toJson("Success delete category"));
    } catch (error) {
      next(error);
    }
  }
}
