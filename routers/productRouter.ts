import { Router, Request, Response } from "express";
import prisma from "../prisma/db";
import helpers from "./../helpers";
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

interface IChangePrice {
    productId: number;
    newPrice: number;
    userId: number;
}

router.get("/", (req: Request, res: Response) => {
    // TODO: test this endpoint with userId in req body

    try {
        prisma.product.findMany({
            where: {
                deletedAt: null,
            }
        })
        .then(async (data) => {
            const currentUser = req.body?.userId || helpers.getCurrentUserInfo(req);
            
            if (currentUser) {
                const currentUserId = currentUser.id;

                const newPriceProducts = await prisma.productNewPrice.findMany({
                    where: {
                        deletedAt: null,
                        userId: currentUserId
                    }
                });

                if (newPriceProducts.length) {
                    const productsWithUpdatedPrices = data.map(product => {
                        return {
                            ...product,
                            price: newPriceProducts.find(item => item.productId === product.id)?.price || product.price,
                        }
                    });

                    res.status(200).send(productsWithUpdatedPrices);
                    return;
                }
            }

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
        prisma.product.findFirst({
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
        const productInfo: IProduct = req.body;
        prisma.product.create({
            data: productInfo,
        })
        .then(() => {
            res.status(201).send("Product created");
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

router.post('/changeprice', (req: Request, res: Response) => {
    try {
        const data: IChangePrice = req.body;

        prisma.productNewPrice.create({
            data: {
                userId: data.userId,
                productId: data.productId,
                price: data.newPrice,
            }
        })
        .then((data) => {
            console.log("Product price changed for account id", data.userId);
            res.status(201).send(data);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
});

export default router;