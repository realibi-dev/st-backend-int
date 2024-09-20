import { Router, Request, Response } from "express";
import prisma from "./../prisma/db";
const router: Router = Router();

interface ICategory {
    name: string;
}

router.get("/", (req: Request, res: Response) => {
    try {
        prisma.category.findMany({
            where: {
                deletedAt: null,
            }
        })
        .then((data) => {
            res.status(200).send(data);
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
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

export default router;