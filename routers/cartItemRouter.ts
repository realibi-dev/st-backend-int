import { Router, Request, Response } from "express";
import prisma from "../prisma/db";
const router: Router = Router();

export interface ICartItem {
    productId: number;
    cartId: number;
    price: number|undefined;
    quantity: number;
}

router.get("/", (req: Request, res: Response) => {
    try {
        prisma.cartItem.findMany({
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
        prisma.cartItem.findFirst({
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
        const cartItemInfo: ICartItem = req.body;

        prisma.product.findFirst({
            where: {
                deletedAt: null,
                id: cartItemInfo.productId,
            }
        })
        .then((product) => {
            if (product) {
                prisma.cartItem.create({
                    data: {
                        ...cartItemInfo,
                        price: cartItemInfo.price || product?.price,
                    },
                })
                .then(() => {
                    res.status(201).send("Cart item created");
                });
            } else {
                res.status(400).send("Product not found!");
            }
        })
    } catch(err) {
        console.error(err);
        res.status(500).send("Server error. Please try later");
    }
})

router.put("/:id", (req: Request, res: Response) => {
    try {
        const id = +req.params.id;
        const cartInfo: ICartItem = req.body;

        prisma.cartItem.update({
            where: {
                id: id,
            }, 
            data: {
                ...cartInfo,
                updatedAt: new Date(),
            },
        })
        .then(() => {
            res.status(200).send("Cart item changed");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.delete("/:id", (req: Request, res: Response) => {
    const id = +req.params.id;

    try {
        prisma.cartItem.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date()
            }
        })
        .then((data) => {
            res.status(200).send("Cart item deleted");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

export default router;