import { Router, Request, Response } from "express";
import prisma from "../prisma/db";
import helpers from "./../helpers";
import moment from "moment";
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

export async function getAvailableProviders() {
    const currentDay = moment().format("dddd");
    const providers = await prisma.providerProfile.findMany({ where: { deletedAt: null } });
    const availableProviders = providers.filter(provider => {
        return !provider.workDays || provider.workDays.includes(currentDay);
    });

    return availableProviders;
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

router.get("/", async (req: Request, res: Response) => {
    try {
        const availableProviders = await getAvailableProviders();
        let data = await prisma.product.findMany({
            where: {
                deletedAt: null,
                providerId: { in: availableProviders.map(provider => provider.id) },
            },
            orderBy: [
                { orderCoefficient: 'desc' },
                { rating: 'desc' },
                { reviewsCount: 'desc' },
            ]
        })

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

        const productBadgeRelations = await prisma.productBadge.findMany({
            where: {
                deletedAt: null,
                productId: {
                    in: data.map(product => product.id),
                }
            }
        })

        const badges = await prisma.badge.findMany({
            where: {
                deletedAt: null,
                id: {
                    in: productBadgeRelations.map(pb => pb.badgeId),
                }
            }
        });

        const badgeWithProductIds = badges.map(badge => {
            return {
                ...badge,
                productIds: productBadgeRelations
                    .filter(pb => pb.badgeId === badge.id)
                    .map(pb => pb.productId),
            }
        });

        data = data.map(product => ({
            ...product,
            providerName: availableProviders.find(p => p.id === product.providerId)?.name,
            // @ts-ignore
            badges: badgeWithProductIds.reduce((acc, item) => {
                if (item.productIds.includes(product.id)) {
                    return [...acc, item.name];
                } else {
                    return acc;
                }
            }, []),
        }));

        res.status(200).send(data);
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

        if ("minPrice" in filters && "maxPrice" in filters) {
            searchConditions.AND = [
                {
                    // @ts-ignore
                    price: { gte: +filters.minPrice },
                },
                {
                    // @ts-ignore
                    price: { lte: +filters.maxPrice },
                },
            ];
        } else if ("minPrice" in filters) {
            // @ts-ignore
            searchConditions.price = { gte: +filters.minPrice };
        } else if ("maxPrice" in filters) {
            // @ts-ignore
            searchConditions.price = { lte: +filters.maxPrice };
        }

        let availableProviders = await getAvailableProviders();

        if ("providerIds" in filters) {
            availableProviders = availableProviders.filter(provider => filters.providerIds?.includes(provider.id))
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

        let products = await prisma.product.findMany({
            orderBy: [
                { orderCoefficient: 'desc' },
                { rating: 'desc' },
                { reviewsCount: 'desc' },
                sortingMethod,
            ],
            where: {
                ...searchConditions,
                providerId: { in: availableProviders.map(item => item.id) },
            },
        });

        if ("name" in filters) {
            // @ts-ignore
            products = products.filter(product => product.name.toLowerCase().includes(filters.name.toLowerCase()));
        }

        const productBadgeRelations = await prisma.productBadge.findMany({
            where: {
                deletedAt: null,
                productId: {
                    in: products.map(product => product.id),
                }
            }
        })

        const badges = await prisma.badge.findMany({
            where: {
                deletedAt: null,
                id: {
                    in: productBadgeRelations.map(pb => pb.badgeId),
                }
            }
        });

        const badgeWithProductIds = badges.map(badge => {
            return {
                ...badge,
                productIds: productBadgeRelations
                  .filter(pb => pb.badgeId === badge.id)
                  .map(pb => pb.productId),
            }
        });

        const providers = await prisma.providerProfile.findMany({
            where: {
                deletedAt: null
            },
        });

        products = products.map(product => ({
            ...product,
            providerName: providers.find(p => p.id === product.providerId)?.name,
            // @ts-ignore
            badges: badgeWithProductIds.reduce((acc, item) => {
                if (item.productIds.includes(product.id)) {
                    return [...acc, item.name];
                } else {
                    return acc;
                }
            }, []),
        }));

        const currentUserId = req.body?.userId || helpers.getCurrentUserInfo(req)?.id;

        if (currentUserId) {
            const newPriceProducts = await prisma.productNewPrice.findMany({
                where: {
                    deletedAt: null,
                    userId: +currentUserId
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

router.get("/subCategory/:subCategoryId", async (req: Request, res: Response) => {
    try {
        const subCategoryId = +req.params.subCategoryId;
        const availableProviders = await getAvailableProviders();

        let data = await prisma.product.findMany({
            where: {
                deletedAt: null,
                subCategoryId,
                providerId: { in: availableProviders.map(item => item.id) },
            }
        })

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

        const productBadgeRelations = await prisma.productBadge.findMany({
            where: {
                deletedAt: null,
                productId: {
                    in: data.map(product => product.id),
                }
            }
        })

        const badges = await prisma.badge.findMany({
            where: {
                deletedAt: null,
                id: {
                    in: productBadgeRelations.map(pb => pb.badgeId),
                }
            }
        });

        const badgeWithProductIds = badges.map(badge => {
            return {
                ...badge,
                productIds: productBadgeRelations
                  .filter(pb => pb.badgeId === badge.id)
                  .map(pb => pb.productId),
            }
        });

        const providers = await prisma.providerProfile.findMany({
            where: {
                deletedAt: null
            },
        });
        data = data.map(product => ({
            ...product,
            providerName: providers.find(p => p.id === product.id)?.name,
            // @ts-ignore
            badges: badgeWithProductIds.reduce((acc, item) => {
                if (item.productIds.includes(product.id)) {
                    return [...acc, item.name];
                } else {
                    return acc;
                }
            }, []),
        }));

        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.get("/:id", async (req: Request, res: Response) => {
    const id = +req.params.id;

    try {
        let data = await prisma.product.findFirst({
            where: {
                deletedAt: null,
                id: id,
            }
        })

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

        const productBadgeRelations = await prisma.productBadge.findMany({
            where: {
                deletedAt: null,
                productId: data?.id,
            }
        })

        const badges = await prisma.badge.findMany({
            where: {
                deletedAt: null,
                id: {
                    in: productBadgeRelations.map(pb => pb.badgeId),
                }
            }
        });

        const badgeWithProductIds = badges.map(badge => {
            return {
                ...badge,
                productIds: productBadgeRelations
                  .filter(pb => pb.badgeId === badge.id)
                  .map(pb => pb.productId),
            }
        });

        // @ts-ignore
        const _badges = badgeWithProductIds.reduce((acc, item) => {
            // @ts-ignore
            if (item.productIds.includes(data?.id)) {
                return [...acc, item.name];
            } else {
                return acc;
            }
        }, []);

        const providers = await prisma.providerProfile.findMany({
            where: {
                deletedAt: null
            },
        });

        // @ts-ignore
        data.providerName = providers.find(p => p.id === data.providerId)?.name;

        res.status(200).send({ ...data, badges: _badges });
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