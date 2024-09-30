import { Router, Request, Response } from "express";
import prisma from "./../prisma/db";
import { ICartItem } from "./cartItemRouter";
const router: Router = Router();

interface IOrder {
    orderNumber: string;
    totalPrice: number;
    deliveryPrice: number|undefined;
    isCompleted: boolean|undefined;
    userId: number;
    branchId: number;
    isPaid: boolean|undefined;
    status: string|undefined;
    cartId: number;
}

router.get("/", (req: Request, res: Response) => {
    try {
        prisma.order.findMany({
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
        prisma.order.findFirst({
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

router.post("/", async (req: Request, res: Response) => {
    try {
        const orderInfo: IOrder = req.body;
        orderInfo.orderNumber = String(Math.round(Math.random() * 100000000));
        
        const cart = await prisma.cart.findFirst({
            where: {
                id: orderInfo.cartId,
            }
        });

        const cartItems = await prisma.cartItem.findMany({
            where: {
                cartId: cart?.id,
            }
        });

        orderInfo.totalPrice = cartItems.reduce((currentSum, item) => {
            return currentSum + (item.price || 0) * item.quantity;
        }, 0);

        const orderPayload = { ...orderInfo, cartId: undefined }

        prisma.order.create({
            data: orderPayload,
        })
        .then((order) => {
            cartItems.map(async (item) => {
                await prisma.orderItem.create({
                    data: {
                        productId: item.productId,
                        orderId: order.id,
                        price: item.price || 0,
                        status: order.status,
                        quantity: item.quantity,
                    }
                });
            });

            prisma.cart.update({
                where: {
                    id: orderInfo.cartId,
                },
                data: {
                    deletedAt: new Date()
                }
            });
            res.status(201).send("Order created");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.delete("/:id", (req: Request, res: Response) => {
    const id = +req.params.id;

    try {
        prisma.order.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date()
            }
        })
        .then((data) => {
            prisma.orderItem.updateMany({
                where: {
                    orderId: id,
                },
                data: {
                    deletedAt: new Date()
                }
            })

            res.status(200).send("Order deleted");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

export default router;