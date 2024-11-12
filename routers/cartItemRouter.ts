import { Router, Request, Response } from "express";
import prisma from "../prisma/db";
import helpers from "../helpers";
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

router.post("/", async (req: Request, res: Response) => {
    try {
        const currentUser = helpers.getCurrentUserInfo(req);
        const cartItemInfo: ICartItem = req.body;

        if (currentUser) {
            let cart = await prisma.cart.findFirst({
                where: {
                    userId: currentUser.id,
                    deletedAt: null,
                }
            });

            if (!cart) {
                cart = await prisma.cart.create({
                    data: {
                        id: Math.floor(Math.random() * 1000000000),
                        userId: currentUser.id,
                    }
                });
            }

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
                            id: Math.floor(Math.random() * 1000000000),
                            ...cartItemInfo,
                            cartId: cart.id,
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
            .catch((err) => {
                console.error(err);
                res.status(500).send("Server error. Please try later");
            });
        }
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
        prisma.cartItem.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date(),
                updatedAt: new Date(),
            }
        })
        .then((data) => {
            res.status(200).send("Cart item deleted");
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