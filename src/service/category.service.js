import { db } from "../db/connector.js";
import { APIError } from "../error/api.error.js";
import { ROLE, checkAllowedRole } from "../helper/role-check.helper.js";
import { API_STATUS_CODE } from "../helper/status-code.helper.js";

export class CategoryService {
  static async checkCategoryMustBeExistById(categoryId) {
    if (!categoryId) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Category Id Not Inputed!");
    }

    const existedCategory = await db.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!existedCategory) {
      throw new APIError(API_STATUS_CODE.NOT_FOUND, "Category not found!");
    }

    return existedCategory;
  }

  static async createCategory(request) {
    const { name, loggedUserRole } = request;

    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    if (!name) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Name must not missing!");
    }

    const countCategory = await db.category.count({
      where: {
        name,
      },
    });

    if (countCategory !== 0) {
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, "Category already exists!");
    }

    const createCategory = await db.category.create({
      data: {
        name,
      },
    });

    return createCategory;
  }

  static async updateCategory(request) {
    const { name, categoryId, loggedUserRole } = request;

    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedCategory = await CategoryService.checkCategoryMustBeExistById(categoryId);

    const updateCategory = await db.category.update({
      where: {
        id: existedCategory.id,
      },
      data: {
        name,
      },
    });

    return updateCategory;
  }

  static async getAllCategory(request) {
    const { name } = request;
    const filter = {};

    if (name) {
      filter.name = {
        name: {
          contains: name,
          mode: "insensitive",
        },
      };
    }

    const categories = await db.category.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      where: filter,
    });

    return categories;
  }

  static async deleteCategory(request) {
    const { categoryId, loggedUserRole } = request;

    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedCategory = await CategoryService.checkCategoryMustBeExistById(categoryId);

    await db.category.delete({
      where: {
        id: existedCategory.id,
      },
    });

    return true;
  }
}
