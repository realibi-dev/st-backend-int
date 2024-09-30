import { Router, Request, Response } from "express";
import prisma from "../prisma/db";
const router: Router = Router();

interface IProduct {
    name: string;
    compound: string;
    temperature: string;
    price: number;
    oldPrice: number|undefined;
    image: string|undefined;
    expirationDate: string;
    categoryId: number;
    providerId: number;
}

router.get("/", (req: Request, res: Response) => {
    try {
        prisma.product.findMany({
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
        prisma.product.findFirst({
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
        const productInfo: IProduct = req.body;
        prisma.product.create({
            data: productInfo,
        })
        .then(() => {
            res.status(201).send("Product created");
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.put("/:id", (req: Request, res: Response) => {
    try {
        const id = +req.params.id;
        const productInfo: IProduct = req.body;

        prisma.product.update({
            where: {
                id: id,
            }, 
            data: {
                ...productInfo,
                updatedAt: new Date(),
            },
        })
        .then(() => {
            res.status(200).send("Product changed");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.delete("/:id", (req: Request, res: Response) => {
    const id = +req.params.id;

    try {
        prisma.product.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date()
            }
        })
        .then((data) => {
            res.status(200).send("Product deleted");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

export default router;