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

  static async create(request) {
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
      throw new APIError(API_STATUS_CODE.BAD_REQUEST, `Category ${name} already exists!`);
    }

    const createCategory = await db.category.create({
      data: {
        name,
      },
    });

    return {
      id: createCategory.id,
      name: createCategory.name,
      createdAt: createCategory.createdAt,
    };
  }

  static async update(request) {
    const { name, categoryId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedCategory = await this.checkCategoryMustBeExistById(categoryId);

    const updateCategory = await db.category.update({
      where: {
        id: existedCategory.id,
      },
      data: {
        name,
      },
    });

    return {
      id: updateCategory.id,
      name: updateCategory.name,
      createdAt: updateCategory.createdAt,
    };
  }

  static async getAll(request) {
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
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return categories;
  }

  static async delete(request) {
    const { categoryId, loggedUserRole } = request;
    checkAllowedRole(ROLE.IS_ADMIN, loggedUserRole);

    const existedCategory = await this.checkCategoryMustBeExistById(categoryId);

    await db.category.delete({
      where: {
        id: existedCategory.id,
      },
    });

    return true;
  }
}
