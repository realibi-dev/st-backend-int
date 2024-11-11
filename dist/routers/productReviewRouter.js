"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../prisma/db"));
const helpers_1 = __importDefault(require("./../helpers"));
const middlewares_1 = __importDefault(require("../middlewares"));
const router = (0, express_1.Router)();
const getUpdatedRatingAndCount = (productId, newRating) => __awaiter(void 0, void 0, void 0, function* () {
    const productReviews = yield db_1.default.productReview.findMany({ where: { productId, deletedAt: null } });
    const totalRating = productReviews.reduce((acc, review) => acc + review.rating, 0) + newRating;
    const averageRating = totalRating / (productReviews.length + 1);
    return { rating: averageRating, count: productReviews.length + 1 };
});
router.get("/reviewedProducts/:orderId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.params;
        const reviewedOrderItems = yield db_1.default.orderItem.findMany({
            where: {
                orderId: parseInt(orderId),
                deletedAt: null,
            },
        });
        res.status(200).send({ orderId: +orderId, orderItemIds: reviewedOrderItems.map(item => item.id) });
    }
    catch (error) {
        res.status(500).send(error);
    }
}));
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productReviews = yield db_1.default.productReview.findMany({ where: { deletedAt: null } });
        res.json(productReviews);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
router.get("/product/:productId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId } = req.params;
        const productReviews = yield db_1.default.productReview.findMany({ where: { productId: parseInt(productId), deletedAt: null } });
        res.json(productReviews);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
router.post("/", middlewares_1.default.checkAuthorization, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = helpers_1.default.getCurrentUserInfo(req).id;
        const { productId, rating, comment, orderId } = req.body;
        const { rating: updatedRating, count: updatedCount } = yield getUpdatedRatingAndCount(productId, rating);
        const productReview = yield db_1.default.productReview.create({ data: { userId, productId, rating, comment, orderId } });
        yield db_1.default.product.update({ where: { id: productId }, data: { rating: updatedRating, reviewsCount: updatedCount } });
        res.json(productReview);
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
router.delete("/:id", middlewares_1.default.checkAuthorization, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const productReview = yield db_1.default.productReview.update({ where: { id: parseInt(id) }, data: { deletedAt: new Date() } });
        res.status(200).send(productReview);
    }
    catch (error) {
        res.status(500).send(error);
    }
}));
exports.default = router;
