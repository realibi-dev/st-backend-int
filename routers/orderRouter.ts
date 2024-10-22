import { Router, Request, Response } from "express";
import prisma from "./../prisma/db";
import helpers from "../helpers";
import middlewares from "../middlewares";
const router: Router = Router();

interface IOrder {
    orderNumber: string;
    totalPrice: number;
    deliveryPrice: number|undefined;
    isCompleted: boolean|undefined;
    userId: number; // не указываем
    branchId: number;
    isPaid: boolean|undefined;
    status: string|undefined;
    cartId: number; // не указываем
}

interface IStatisticsSettings {
    startDate: string;
    endDate: string;
}

router.get("/userOrderHistory", middlewares.checkAuthorization, async (req: Request, res: Response) => {
    try {
        const currentUser = helpers.getCurrentUserInfo(req);

        const userOrders = await prisma.order.findMany({
            where: {
                userId: currentUser.id,
                deletedAt: null,
            }
        });

        const orderItems = await prisma.orderItem.findMany({
            where: {
                orderId: {
                    in: userOrders.map(order => order.id),
                },
                deletedAt: null,
            }
        });

        const userOrdersResult = userOrders.map(order => {
            const currentOrderProducts = orderItems.filter(orderItem => orderItem.orderId === order.id);

            return {
                ...order,
                products: currentOrderProducts,
            };
        });

        res.status(200).send(userOrdersResult);
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }
});

router.get("/", (req: Request, res: Response) => {
    try {
        prisma.order.findMany({
            where: {
                deletedAt: null,
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
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
    try {
        const id = +req.params.id;

        prisma.order.findFirst({
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
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.post("/", middlewares.checkAuthorization, async (req: Request, res: Response) => {
    try {
        const currentUser = helpers.getCurrentUserInfo(req);

        const orderInfo: IOrder = req.body;
        orderInfo.orderNumber = String(Math.round(Math.random() * 100000000));
        
        const cart = await prisma.cart.findFirst({
            where: {
                userId: currentUser.id,
                deletedAt: null,
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

        orderInfo.userId = currentUser.id;

        const orderPayload = { ...orderInfo }

        prisma.order.create({
            data: orderPayload,
        })
        .then(async (order) => {
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

            await prisma.cart.update({
                where: {
                    id: cart?.id,
                },
                data: {
                    deletedAt: new Date()
                }
            })

            await prisma.cartItem.updateMany({
                where: {
                    cartId: cart?.id
                },
                data: {
                    deletedAt: new Date()
                }
            })

            res.status(201).send("Order created");
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

router.post("/statistics", async (req: Request, res: Response) => {
    try {
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
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }
})

export default router;