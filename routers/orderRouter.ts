import { Router, Request, Response } from "express";
import prisma from "./../prisma/db";
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

interface IStatisticsSettings {
    startDate: string;
    endDate: string;
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

router.post("/statistics", async (req: Request, res: Response) => {
    const statisticsSettings: IStatisticsSettings = req.body;

    let orderItems: any = await prisma.orderItem.findMany({
        where: {
            AND: [
                {
                    deletedAt: null,
                },
                {
                    createdAt: {
                        gt: new Date(statisticsSettings.startDate),
                    },
                },
                {
                    createdAt: {
                        lt: new Date(statisticsSettings.endDate),
                    },
                }
            ],
        }
    });

    const products = await prisma.product.findMany({
        where: {
            id: {
                in: orderItems.map((item: any) => item.productId), // [3, 2, 1]
            }
        }
    });

    orderItems = orderItems.map((item: any) => {
        return {
            ...item,
            productName: products.find(product => product.id === item.productId)?.name,
        }
    })

    const uniqueProductIds = [...new Set(orderItems.map((item: any) => item.productId))];
    const uniqueProducts = uniqueProductIds.map(productId => {
        const totalQuantity = orderItems.filter((orderItem: any) => orderItem.productId === productId).reduce((acc: any, item: any) => {
            return acc + item.quantity;
        }, 0);

        const totalPriceSum = orderItems.filter((orderItem: any) => orderItem.productId === productId).reduce((acc: any, item: any) => {
            return acc + (item.price * item.quantity);
        }, 0);
        
        return {
            ...orderItems.find((orderItem: any) => orderItem.productId === productId),
            quantity: totalQuantity,
            priceSum: totalPriceSum,
        }
    })

    res.status(200).send({
        products: uniqueProducts,
        totalSum: uniqueProducts.reduce((acc: any, item: any) => {
            return acc + item.priceSum
        }, 0),
    });
})

export default router;