import { Router, Request, Response } from "express";
import prisma from "../prisma/db";
import helpers from "../helpers";
import middlewares from "../middlewares";
const router: Router = Router();

interface IProviderProfile {
    name: string;
    image: string|undefined;
    userId: number;
}

router.get("/orders", middlewares.checkProvider, async (req: Request, res: Response) => {
    try {
        const currentUser = helpers.getCurrentUserInfo(req);

        const provider = await prisma.providerProfile.findFirst({
            where: {
                userId: currentUser.id,
                deletedAt: null,
            }
        });
    
        const providerProducts = await prisma.product.findMany({
            where: {
                providerId: provider?.id,
                deletedAt: null,
            }
        });
    
        let orderItems = await prisma.orderItem.findMany({
            where: {
                deletedAt: null,
                productId: {
                    in: providerProducts.map((product) => product.id),
                },
            }
        });

        const products = await prisma.product.findMany({
            where: {
                id: {
                    in: orderItems.map((item) => item.productId),
                },
            }
        });

        orderItems = orderItems.map((item) => {
            return {
                ...item,
                productName: products.find((product) => product.id === item.productId)?.name,
            }
        });
    
        let orders = await prisma.order.findMany({
            where: {
                deletedAt: null,
                id: {
                    in: orderItems.map((item) => item.orderId),
                },
            }
        });
    
        orders = orders.map((order) => {
            return {
                ...order,
                items: orderItems.filter((item) => item.orderId === order.id),
            }
        });
    
        res.status(200).send(orders);
    } catch (error) {
        console.error(new Date().toISOString(), error);
        res.status(500).send(error);
    }
});

router.get("/", (req: Request, res: Response) => {
    try {
        prisma.providerProfile.findMany({
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
        prisma.providerProfile.findFirst({
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
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.post("/", (req: Request, res: Response) => {
    try {
        const providerInfo: IProviderProfile = req.body;
        prisma.providerProfile.create({
            data: {
                id: Math.floor(Math.random() * 1000000000),
                ...providerInfo,
            },
        })
        .then(() => {
            res.status(201).send("Provider profile created");
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

router.put("/:id", (req: Request, res: Response) => {
    try {
        const id = +req.params.id;
        const providerInfo: IProviderProfile = req.body;

        prisma.providerProfile.update({
            where: {
                id: id,
            }, 
            data: {
                ...providerInfo,
                updatedAt: new Date(),
            },
        })
        .then(() => {
            res.status(200).send("Provider profile changed");
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
        prisma.providerProfile.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date()
            }
        })
        .then((data) => {
            res.status(200).send("Provider profile deleted");
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