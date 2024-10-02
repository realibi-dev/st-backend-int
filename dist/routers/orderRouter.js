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
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    try {
        db_1.default.order.findMany({
            where: {
                deletedAt: null,
            }
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
    const id = +req.params.id;
    try {
        db_1.default.order.findFirst({
            where: {
                deletedAt: null,
                id: id,
            }
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
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderInfo = req.body;
        orderInfo.orderNumber = String(Math.round(Math.random() * 100000000));
        const cart = yield db_1.default.cart.findFirst({
            where: {
                id: orderInfo.cartId,
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
        const orderPayload = Object.assign(Object.assign({}, orderInfo), { cartId: undefined });
        db_1.default.order.create({
            data: orderPayload,
        })
            .then((order) => {
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
            db_1.default.cart.update({
                where: {
                    id: orderInfo.cartId,
                },
                data: {
                    deletedAt: new Date()
                }
            });
            res.status(201).send("Order created");
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
