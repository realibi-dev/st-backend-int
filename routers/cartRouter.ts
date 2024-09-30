import { Router, Request, Response } from "express";
import prisma from "../prisma/db";
const router: Router = Router();

interface ICart {
    userId: number;
}

router.get("/", (req: Request, res: Response) => {
    try {
        prisma.cart.findMany({
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
        prisma.cart.findFirst({
            where: {
                deletedAt: null,
                id: id,
            }
        })
        .then(async (data) => {
            const cartItems = await prisma.cartItem.findMany({
                where: {
                    deletedAt: null,
                    cartId: data?.id,
                }
            });

            res.status(200).send({ ...data, items: cartItems });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.post("/", (req: Request, res: Response) => {
    try {
        const cartInfo: ICart = req.body;
        prisma.cart.create({
            data: cartInfo,
        })
        .then(() => {
            res.status(201).send("Cart created");
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

export default router;