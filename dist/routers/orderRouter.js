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
const db_1 = __importDefault(require("./../prisma/db"));
const helpers_1 = __importDefault(require("../helpers"));
const middlewares_1 = __importDefault(require("../middlewares"));
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    try {
        db_1.default.order.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
});
router.get("/:id", (req, res) => {
    try {
        const id = +req.params.id;
        db_1.default.order.findFirst({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
});
router.post("/", middlewares_1.default.checkAuthorization, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUser = helpers_1.default.getCurrentUserInfo(req);
        const orderInfo = req.body;
        orderInfo.orderNumber = String(Math.round(Math.random() * 100000000));
        const cart = yield db_1.default.cart.findFirst({
            where: {
                userId: currentUser.id,
                deletedAt: null,
            }
        });
        const cartItems = yield db_1.default.cartItem.findMany({
            where: {
                cartId: cart === null || cart === void 0 ? void 0 : cart.id,
            }
        });
        orderInfo.totalPrice = cartItems.reduce((currentSum, item) => {
            return currentSum + (item.price || 0) * item.quantity;
        }, 0);
        orderInfo.userId = currentUser.id;
        const orderPayload = Object.assign({}, orderInfo);
        db_1.default.order.create({
            data: orderPayload,
        })
            .then((order) => __awaiter(void 0, void 0, void 0, function* () {
            cartItems.map((item) => __awaiter(void 0, void 0, void 0, function* () {
                yield db_1.default.orderItem.create({
                    data: {
                        productId: item.productId,
                        orderId: order.id,
                        price: item.price || 0,
                        status: order.status,
                        quantity: item.quantity,
                    }
                });
            }));
            yield db_1.default.cart.update({
                where: {
                    id: cart === null || cart === void 0 ? void 0 : cart.id,
                },
                data: {
                    deletedAt: new Date()
                }
            });
            yield db_1.default.cartItem.updateMany({
                where: {
                    cartId: cart === null || cart === void 0 ? void 0 : cart.id
                },
                data: {
                    deletedAt: new Date()
                }
            });
            res.status(201).send("Order created");
        }))
            .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
}));
router.delete("/:id", (req, res) => {
    const id = +req.params.id;
    try {
        db_1.default.order.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date()
            }
        })
            .then((data) => {
            db_1.default.orderItem.updateMany({
                where: {
                    orderId: id,
                },
                data: {
                    deletedAt: new Date()
                }
            });
            res.status(200).send("Order deleted");
        })
            .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
});
router.post("/statistics", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const statisticsSettings = req.body;
    let orderItems = yield db_1.default.orderItem.findMany({
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
    const products = yield db_1.default.product.findMany({
        where: {
            id: {
                in: orderItems.map((item) => item.productId), // [3, 2, 1]
            }
        }
    });
    orderItems = orderItems.map((item) => {
        var _a;
        return Object.assign(Object.assign({}, item), { productName: (_a = products.find(product => product.id === item.productId)) === null || _a === void 0 ? void 0 : _a.name });
    });
    const uniqueProductIds = [...new Set(orderItems.map((item) => item.productId))];
    const uniqueProducts = uniqueProductIds.map(productId => {
        const totalQuantity = orderItems.filter((orderItem) => orderItem.productId === productId).reduce((acc, item) => {
            return acc + item.quantity;
        }, 0);
        const totalPriceSum = orderItems.filter((orderItem) => orderItem.productId === productId).reduce((acc, item) => {
            return acc + (item.price * item.quantity);
        }, 0);
        return Object.assign(Object.assign({}, orderItems.find((orderItem) => orderItem.productId === productId)), { quantity: totalQuantity, priceSum: totalPriceSum });
    });
    res.status(200).send({
        products: uniqueProducts,
        totalSum: uniqueProducts.reduce((acc, item) => {
            return acc + item.priceSum;
        }, 0),
    });
}));
exports.default = router;
