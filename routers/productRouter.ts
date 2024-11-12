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
    subCategoryId: number;
    providerId: number;
}

interface IChangePrice {
    productId: number;
    newPrice: number;
    userId: number;
}

interface IFilter {
    name: string|undefined;
    minPrice: number|undefined;
    maxPrice: number|undefined;
    providerIds: Array<number>|undefined;
    subCategoryIds: Array<number>|undefined;
    sortingMethod: string|undefined; // Сортировка по цене: asc, desc
}

router.get('/filterData', async (req: Request, res: Response) => {
    try {
        const providers = await prisma.providerProfile.findMany({ where: { deletedAt: null } });
        const subCategories = await prisma.subCategory.findMany({ where: { deletedAt: null } });
        const maxPrice = await prisma.product.findFirst({ where: { deletedAt: null }, orderBy: { price: 'desc' } });
        const minPrice = await prisma.product.findFirst({ where: { deletedAt: null }, orderBy: { price: 'asc' } });

        res.status(200).send({
            providers,
            subCategories,
            maxPrice: maxPrice?.price,
            minPrice: minPrice?.price,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.get("/", (req: Request, res: Response) => {
    try {
        prisma.product.findMany({
            where: {
                deletedAt: null,
            },
            orderBy: [
                { orderCoefficient: 'desc' },
                { rating: 'desc' },
                { reviewsCount: 'desc' },
            ]
        })
        .then(async (data) => {
            const currentUserId = req.body?.userId || helpers.getCurrentUserInfo(req)?.id;
            
            if (currentUserId) {
                const newPriceProducts = await prisma.productNewPrice.findMany({
                    where: {
                        deletedAt: null,
                        userId: currentUserId
                    },
                });

                if (newPriceProducts.length) {
                    let productsWithUpdatedPrices = data.map(product => {
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

interface ISearchConditions {
    [key: string]: any;
}

router.post("/filter", async (req: Request, res: Response) => {
    try {
        const filters: IFilter = req.body;

        const searchConditions: ISearchConditions = {
            deletedAt: null,
        };

        if ("name" in filters) {
            searchConditions.name = {
                contains: filters.name?.toLowerCase(),
                mode: 'insensitive',
            }
        }

        if ("minPrice" in filters) {
            searchConditions.price = {
                gte: filters.minPrice,
            };
        }

        if ("maxPrice" in filters) {
            if ("minPrice" in filters) {
                delete searchConditions.price;

                searchConditions.AND = [
                    {
                        price: {
                            gte: filters.minPrice,
                        }
                    },
                    {
                        price: {
                            lte: filters.maxPrice,
                        }
                    }
                ]
            } else {
                searchConditions.price = {
                    lte: filters['maxPrice'],
                };
            }
        }

        if ("providerIds" in filters) {
            searchConditions.providerId = {
                in: filters.providerIds,
            };
        }

        if ("subCategoryIds" in filters) {
            searchConditions.subCategoryId = {
                in: filters.subCategoryIds,
            };
        }

        let sortingMethod = {};

        if ("sortingMethod" in filters) {
            sortingMethod = {
                price: filters.sortingMethod,
            }
        }

        const products = await prisma.product.findMany({
            orderBy: [
                { orderCoefficient: 'desc' },
                { rating: 'desc' },
                { reviewsCount: 'desc' },
                sortingMethod,
            ],
            where: searchConditions,
        });

        const currentUserId = req.body?.userId || helpers.getCurrentUserInfo(req)?.id;

        if (currentUserId) {
            const newPriceProducts = await prisma.productNewPrice.findMany({
                where: {
                    deletedAt: null,
                    userId: currentUserId
                }
            });

            if (newPriceProducts.length) {
                const productsWithUpdatedPrices = products.map(product => {
                    return {
                        ...product,
                        price: newPriceProducts.find(item => item.productId === product.id)?.price || product.price,
                    }
                });

                res.status(200).send(productsWithUpdatedPrices);
                return;
            }
        }

        res.status(200).send(products);
    } catch(error) {
        console.error(error);
        res.status(500).send(error);
    }
})

router.get("/subCategory/:subCategoryId", (req: Request, res: Response) => {
    // TODO: test this endpoint with userId in req body

    try {
        const subCategoryId = +req.params.subCategoryId;

        prisma.product.findMany({
            where: {
                deletedAt: null,
                subCategoryId,
            }
        })
        .then(async (data) => {
            const currentUserId = req.body?.userId || helpers.getCurrentUserInfo(req)?.id;
            
            if (currentUserId) {
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
        .then(async (data) => {
            const currentUserId = req.body?.userId || helpers.getCurrentUserInfo(req)?.id;
            
            if (currentUserId) {
                const newPriceProduct = await prisma.productNewPrice.findFirst({
                    where: {
                        deletedAt: null,
                        userId: currentUserId,
                        productId: id,
                    }
                });

                if (newPriceProduct) {
                    res.status(200).send({
                        ...data,
                        price: newPriceProduct.price || data?.price,
                    })
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

router.post("/", (req: Request, res: Response) => {
    try {
        const productInfo: IProduct = req.body;
        console.log("Product info", productInfo);
        prisma.product.create({
            data: {
                id: Math.floor(Math.random() * 1000000000),
                ...productInfo,
            },
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
                id: Math.floor(Math.random() * 1000000000),
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