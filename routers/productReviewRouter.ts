import { Router, Request, Response } from "express";
import prisma from "../prisma/db";
import helpers from "./../helpers";
import middlewares from "../middlewares";
const router: Router = Router();

interface IProductReview {
    userId: number;
    productId: number;
    rating: number;
    comment: string | undefined | null;
    orderId: number;
}

const getUpdatedRatingAndCount = async (productId: number, newRating: number) => {
    const productReviews = await prisma.productReview.findMany({ where: { productId, deletedAt: null } });
    const totalRating = productReviews.reduce((acc, review) => acc + review.rating, 0) + newRating;
    const averageRating = totalRating / (productReviews.length + 1);
    return { rating: averageRating, count: productReviews.length + 1 };
}

router.get("/reviewedProducts/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;
        const reviewedOrderItems = await prisma.orderItem.findMany({
            where: {
                orderId: parseInt(orderId),
                deletedAt: null,
            },
        });

        res.status(200).send({ orderId: +orderId, orderItemIds: reviewedOrderItems.map(item => item.id) });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get("/", async (req: Request, res: Response) => {
    try {
        const productReviews: IProductReview[] = await prisma.productReview.findMany({ where: { deletedAt: null } });
        res.json(productReviews);
    } catch (error) {
        res.status(500).json(error);
    }
});

router.get("/product/:productId", async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;
        const productReviews = await prisma.productReview.findMany({ where: { productId: parseInt(productId), deletedAt: null } });
        res.json(productReviews);
    } catch (error) {
        res.status(500).json(error);
    }
});

router.post("/", middlewares.checkAuthorization, async (req: Request, res: Response) => {
    try {
        const userId: number = helpers.getCurrentUserInfo(req).id;
        const { productId, rating, comment, orderId } = req.body;

        const { rating: updatedRating, count: updatedCount } = await getUpdatedRatingAndCount(productId, rating);
        const productReview: IProductReview = await prisma.productReview.create({ data: { id: Math.floor(Math.random() * 1000000000), userId, productId, rating, comment, orderId } });
        await prisma.product.update({ where: { id: productId }, data: { rating: updatedRating, reviewsCount: updatedCount } });
        res.json(productReview);
    } catch (error) {
        res.status(500).json(error);
    }
});

router.delete("/:id", middlewares.checkAuthorization, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const productReview: IProductReview = await prisma.productReview.update({ where: { id: parseInt(id) }, data: { deletedAt: new Date() } });
        res.status(200).send(productReview);
    } catch (error) {
        res.status(500).send(error);
    }
});

export default router;