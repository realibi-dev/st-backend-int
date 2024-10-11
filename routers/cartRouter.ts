import { Router, Request, Response } from "express";
import prisma from "../prisma/db";
import helpers from "../helpers";
import { ICartItem } from "./cartItemRouter";
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
        const cartInfo: ICart = req.body;
        prisma.cart.create({
            data: cartInfo,
        })
        .then(() => {
            res.status(201).send("Cart created");
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

router.post("/addItem", async (req: Request, res: Response) => {
    try {
        const newCartItem = req.body;
        console.log("newCartItem", newCartItem);
        const currentUserId = helpers.getCurrentUserInfo(req)?.id;
        console.log("currentUserId", currentUserId);
        if (currentUserId) {
            let existingCart = await prisma.cart.findFirst({
                where: {
                    deletedAt: null,
                    userId: currentUserId,
                }
            });
    
            if (!existingCart) {
                existingCart = await prisma.cart.create({
                    data: {
                        userId: currentUserId,
                    }
                });
            }
    
            const existingItemInCart = await prisma.cartItem.findFirst({
                where: {
                    deletedAt: null,
                    cartId: existingCart.id,
                    productId: newCartItem.productId
                }
            });

            if (!existingItemInCart) {
                await prisma.cartItem.create({
                    data: {
                        productId: newCartItem.productId,
                        cartId: existingCart.id,
                        price: newCartItem.price || 0,
                        quantity: newCartItem.quantity,
                    }
                });
            }
    
            res.status(201).send({ success: true });
        } else {
            res.status(401).send({
                success: false,
                message: "User not authorized",
            })
        }
    } catch(error) {
        console.error(error);
        res.status(500).send({ success: false });
    }
});

export default router;