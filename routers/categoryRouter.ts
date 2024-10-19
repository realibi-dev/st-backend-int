import { Router, Request, Response } from "express";
import prisma from "./../prisma/db";
const router: Router = Router();

interface ICategory {
    name: string;
}

interface ISubCategory {
    name: string;
    image: string|undefined;
    categoryId: number|undefined;
}

router.get("/", (req: Request, res: Response) => {
    try {
        prisma.category.findMany({
            where: {
                deletedAt: null,
            }
        })
        .then(async (categories) => {
            const subCategories = await prisma.subCategory.findMany({
                where: {
                    deletedAt: null,
                }
            });

            categories = categories.map(item => {
                return {
                    ...item,
                    subCategories: subCategories.filter(subCategory => subCategory.categoryId === item.id),
                }
            })

            res.status(200).send(categories);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.get("/:id", (req: Request, res: Response) => {
    const id = +req.params.id;

    try {
        prisma.category.findFirst({
            where: {
                deletedAt: null,
                id: id,
            }
        })
        .then((data) => {
            res.status(200).send(data);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.post("/", (req: Request, res: Response) => {
    try {
        const categoryInfo: ICategory = req.body;
        prisma.category.create({
            data: categoryInfo,
        })
        .then(() => {
            res.status(201).send("Category created");
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.post("/subCategories", (req: Request, res: Response) => {
    try {
        const subCategoryInfo: ISubCategory = req.body;
        prisma.subCategory.create({
            data: subCategoryInfo,
        })
        .then(() => {
            res.status(201).send("Subcategory created");
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.put("/:id", (req: Request, res: Response) => {
    try {
        const id = +req.params.id;
        const categoryInfo: ICategory = req.body;

        prisma.category.update({
            where: {
                id: id,
            }, 
            data: {
                ...categoryInfo,
                updatedAt: new Date(),
            },
        })
        .then(() => {
            res.status(200).send("Category changed");
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.delete("/:id", (req: Request, res: Response) => {
    const id = +req.params.id;

    try {
        prisma.category.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date()
            }
        })
        .then((data) => {
            res.status(200).send("Category deleted");
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

export default router;