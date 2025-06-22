import { Router, Request, Response } from "express";
import prisma from "../prisma/db";
import {getAvailableProviders} from "./productRouter";
import helpers from "../helpers";
const router: Router = Router();

router.get("/search", async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const searchName: string = req.query.name;
        const badge = await prisma.badge.findFirst({
            where: {
                name: searchName,
                deletedAt: null,
            }
        });

        if (!badge) {
            return res.status(400).json({message: "Badge not found"});
        }

        const productsOfBadge = await prisma.productBadge.findMany({
            where: {
                deletedAt: null,
                badgeId: badge.id,
            }
        });


        const providers = await prisma.providerProfile.findMany({
            where: {
                deletedAt: null
            },
        });

        const availableProviders = await getAvailableProviders();

        let products = await prisma.product.findMany({
            where: {
                deletedAt: null,
                id: {
                    in: productsOfBadge.map(product => product.productId),
                },
                providerId: {
                    in: availableProviders.map(provider => provider.id),
                }
            }
        });

        products = products.map(product => {
            return {
                ...product,
                providerName: providers.find(p => p.id === product.providerId)?.name,
            }
        });

        res.status(200).send(products);
    } catch(e) {
        res.status(500).json(e);
        console.log(e);
    }
})

router.get("/", async (req: Request, res: Response) => {
    try {
        const badges = await prisma.badge.findMany({
            where: {
                deletedAt: null,
            }
        });

        res.status(200).json(badges);
    } catch(e) {
        res.status(500).json(e);
        console.log(e);
    }
});

router.get("/:badgeId", async(req: Request, res: Response) => {
    try {
        const badgeId = req.params.badgeId;

        let badge = await prisma.badge.findFirst({
            where: {
                deletedAt: null,
                id: +badgeId,
            }
        });

        if (!badge) return res.status(404).json({ message: "No badge found" });

        const productsOfBadge = await prisma.productBadge.findMany({
            where: {
                deletedAt: null,
                badgeId: +badgeId,
            }
        });

        const providers = await prisma.providerProfile.findMany({
            where: {
                deletedAt: null
            },
        });

        const availableProviders = await getAvailableProviders();

        let products = await prisma.product.findMany({
            where: {
                deletedAt: null,
                id: {
                    in: productsOfBadge.map(product => product.productId),
                },
                providerId: {
                    in: availableProviders.map(provider => provider.id),
                }
            }
        });

        products = products.map(product => {
            return {
                ...product,
                providerName: providers.find(p => p.id === product.providerId)?.name,
            }
        });

        const currentUserId = req.body?.userId || helpers.getCurrentUserInfo(req)?.id;
        console.log("current user id", currentUserId);

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

        res.status(200).send({
            badgeName: badge.name,
            products,
        });
    } catch(e) {
        res.status(500).json(e);
        console.log(e);
    }
});

export default router;