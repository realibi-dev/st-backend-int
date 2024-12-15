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

interface IFinancialReportSettings {
    startDate: string;
    endDate: string;
    branchId: number;
}

router.post("/repeat", middlewares.checkAuthorization, async (req: Request, res: Response) => {
    try {
        const { orderId } = req.body;
        const orderItems = await prisma.orderItem.findMany({
            where: {
                orderId: +orderId,
            }
        });

        let products = await prisma.product.findMany({
            where: {
                id: {
                    in: orderItems.map(item => item.productId),
                },
            }
        });

        const unavailableProducts =
          products.filter(product => product.deletedAt !== null);

        const currentUserId = helpers.getCurrentUserInfo(req)?.id;

        const newPriceProducts = await prisma.productNewPrice.findMany({
            where: {
                deletedAt: null,
                userId: +currentUserId
            }
        });

        if (newPriceProducts.length) {
            // @ts-ignore
            products = products.map(product => {
                return {
                    ...product,
                    price: newPriceProducts.find(item => item.productId === product.id)?.price,
                }
            });
        }

        let userCart = await prisma.cart.findFirst({
            where: {
                userId: +currentUserId,
                deletedAt: null,
            }
        });

        if (userCart) {
            await prisma.cart.delete({
                where: {
                    id: userCart.id
                }
            });
        }

        userCart = await prisma.cart.create({
            data: {
                id: Math.round(Math.random() * 1000000),
                userId: +currentUserId,
            }
        })

        const newCartItems =
          products
            .filter(product => product.deletedAt === null)
            .map(product => {
                return {
                    id: Math.round(Math.random() * 1000000),
                    productId: product.id,
                    quantity: 1,
                    // @ts-ignore
                    price: product.price || orderItems.find(item => item.productId === product.id).price,
                    cartId: userCart.id,
                }
            });

        await prisma.cartItem.createMany({
            data: newCartItems,
        });

        const priceRaisedProducts =
          products
            .filter(product => {
                const orderItemProduct = orderItems.find(item => item.productId === product.id);
                // @ts-ignore
                return product.price > orderItemProduct.price;
            })
            .map(product => {
                const orderItemProduct = orderItems.find(item => item.productId === product.id);
                return {
                    ...product,
                    // @ts-ignore
                    oldPrice: orderItemProduct.price,
                }
            })

        res.status(200).send({
            success: true,
            unavailableProducts,
            priceRaisedProducts,
        })

    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false, error: e });
    }
});

router.post("/financial-report", middlewares.checkAuthorization, async (req: Request, res: Response) => {
    try {
        const financialReportSettings: IFinancialReportSettings = req.body;

        const orders = await prisma.order.findMany({
            where: {
                deletedAt: null,
                branchId: financialReportSettings.branchId,
            }
        });

        let orderItems = await prisma.orderItem.findMany({
            where: {
                orderId: {
                    in: orders.map(order => order.id),
                },
                deletedAt: null,
            }
        });

        const products = await prisma.product.findMany({
            where: {
                id: {
                    in: orderItems.map(item => item.productId),
                }
            }
        });

        orderItems = orderItems.map(item => {
            return {
                ...item,
                productName: products.find(product => product.id === item.productId)?.name,
            }
        })

        const result = orders.map(order => {
            return {
                ...order,
                items: orderItems.filter(item => item.orderId === order.id),
            }
        })

        res.status(200).send(result);
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }
})

router.get("/userOrderHistory", middlewares.checkAuthorization, async (req: Request, res: Response) => {
    try {
        const currentUser = helpers.getCurrentUserInfo(req);

        const userOrders = await prisma.order.findMany({
            where: {
                userId: currentUser.id,
                deletedAt: null,
            }
        });

        const productReviews = await prisma.productReview.findMany({
            where: {
                deletedAt: null,
                orderId: {
                    in: userOrders.map(o => o.id),
                },
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

        let userOrdersResult = userOrders.map(order => {
            const currentOrderProducts = orderItems.filter(orderItem => orderItem.orderId === order.id);

            return {
                ...order,
                products: currentOrderProducts,
            };
        });

        const branches = await prisma.branch.findMany({
            where: {
                deletedAt: null,
                id: {
                    in: userOrders.map(order => order.branchId),
                }
            }
        });

        const products = await prisma.product.findMany({
            where: {
                id: {
                    in: orderItems.map(item => item.productId),
                }
            }
        });

        userOrdersResult = userOrdersResult.map(item => {
            const currentOrderReviews = productReviews.filter(review => review.orderId === item.id);

            return {
                ...item,
                reviewed: item.products.every(p => currentOrderReviews.map(r => r.productId).includes(p.productId)),
                branchName: branches.find(branch => branch.id === item.branchId)?.name,
                branchAddress: branches.find(branch => branch.id === item.branchId)?.address,
                products: item.products.map(product => {
                    return {
                        ...product,
                        reviewed: currentOrderReviews.map(review => review.productId).includes(product.productId),
                        cartItemId: product.id,
                        productName: products.find(pr => pr.id === product.productId)?.name
                    }
                })
            }
        })

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
            data: {
                id: Math.floor(Math.random() * 1000000000),
                ...orderPayload,
            },
        })
        .then(async (order) => {
            cartItems.map(async (item) => {
                await prisma.orderItem.create({
                    data: {
                        id: Math.floor(Math.random() * 1000000000),
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
            });

            cartItems.forEach(async (item) => {
                const product = await prisma.product.findFirst({
                    where: {
                        id: item.productId,
                    }
                });

                await prisma.product.update({
                    where: {
                        id: product?.id,
                    },
                    data: {
                        salesCount: (product?.salesCount || 0) + item.quantity,
                    }
                });
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