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
router.post("/repeat", middlewares_1.default.checkAuthorization, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { orderId } = req.body;
        const orderItems = yield db_1.default.orderItem.findMany({
            where: {
                orderId: +orderId,
            }
        });
        let products = yield db_1.default.product.findMany({
            where: {
                id: {
                    in: orderItems.map(item => item.productId),
                },
            }
        });
        const unavailableProducts = products.filter(product => product.deletedAt !== null);
        const currentUserId = (_a = helpers_1.default.getCurrentUserInfo(req)) === null || _a === void 0 ? void 0 : _a.id;
        const newPriceProducts = yield db_1.default.productNewPrice.findMany({
            where: {
                deletedAt: null,
                userId: +currentUserId
            }
        });
        if (newPriceProducts.length) {
            // @ts-ignore
            products = products.map(product => {
                var _a;
                return Object.assign(Object.assign({}, product), { price: (_a = newPriceProducts.find(item => item.productId === product.id)) === null || _a === void 0 ? void 0 : _a.price });
            });
        }
        let userCart = yield db_1.default.cart.findFirst({
            where: {
                userId: +currentUserId,
                deletedAt: null,
            }
        });
        if (userCart) {
            yield db_1.default.cart.delete({
                where: {
                    id: userCart.id
                }
            });
        }
        userCart = yield db_1.default.cart.create({
            data: {
                id: Math.round(Math.random() * 1000000),
                userId: +currentUserId,
            }
        });
        const newCartItems = products
            .filter(product => product.deletedAt === null)
            .map(product => {
            return {
                id: Math.round(Math.random() * 1000000),
                productId: product.id,
                quantity: 1,
                // @ts-ignore
                price: product.price || orderItems.find(item => item.productId === product.id).price,
                cartId: userCart.id,
            };
        });
        yield db_1.default.cartItem.createMany({
            data: newCartItems,
        });
        const priceRaisedProducts = products
            .filter(product => {
            const orderItemProduct = orderItems.find(item => item.productId === product.id);
            // @ts-ignore
            return product.price > orderItemProduct.price;
        })
            .map(product => {
            const orderItemProduct = orderItems.find(item => item.productId === product.id);
            return Object.assign(Object.assign({}, product), { 
                // @ts-ignore
                oldPrice: orderItemProduct.price });
        });
        res.status(200).send({
            success: true,
            unavailableProducts,
            priceRaisedProducts,
        });
    }
    catch (e) {
        console.log(e);
        res.status(500).send({ success: false, error: e });
    }
}));
router.post("/financial-report", middlewares_1.default.checkAuthorization, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const financialReportSettings = req.body;
        const orders = yield db_1.default.order.findMany({
            where: {
                deletedAt: null,
                branchId: financialReportSettings.branchId,
            }
        });
        let orderItems = yield db_1.default.orderItem.findMany({
            where: {
                orderId: {
                    in: orders.map(order => order.id),
                },
                deletedAt: null,
            }
        });
        const products = yield db_1.default.product.findMany({
            where: {
                id: {
                    in: orderItems.map(item => item.productId),
                }
            }
        });
        orderItems = orderItems.map(item => {
            var _a;
            return Object.assign(Object.assign({}, item), { productName: (_a = products.find(product => product.id === item.productId)) === null || _a === void 0 ? void 0 : _a.name });
        });
        const result = orders.map(order => {
            return Object.assign(Object.assign({}, order), { items: orderItems.filter(item => item.orderId === order.id) });
        });
        res.status(200).send(result);
    }
    catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}));
router.get("/userOrderHistory", middlewares_1.default.checkAuthorization, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUser = helpers_1.default.getCurrentUserInfo(req);
        const userOrders = yield db_1.default.order.findMany({
            where: {
                userId: currentUser.id,
                deletedAt: null,
            }
        });
        const productReviews = yield db_1.default.productReview.findMany({
            where: {
                deletedAt: null,
                orderId: {
                    in: userOrders.map(o => o.id),
                },
            }
        });
        const orderItems = yield db_1.default.orderItem.findMany({
            where: {
                orderId: {
                    in: userOrders.map(order => order.id),
                },
                deletedAt: null,
            }
        });
        let userOrdersResult = userOrders.map(order => {
            const currentOrderProducts = orderItems.filter(orderItem => orderItem.orderId === order.id);
            return Object.assign(Object.assign({}, order), { products: currentOrderProducts });
        });
        const branches = yield db_1.default.branch.findMany({
            where: {
                deletedAt: null,
                id: {
                    in: userOrders.map(order => order.branchId),
                }
            }
        });
        const products = yield db_1.default.product.findMany({
            where: {
                id: {
                    in: orderItems.map(item => item.productId),
                }
            }
        });
        userOrdersResult = userOrdersResult.map(item => {
            var _a, _b;
            const currentOrderReviews = productReviews.filter(review => review.orderId === item.id);
            return Object.assign(Object.assign({}, item), { reviewed: item.products.every(p => currentOrderReviews.map(r => r.productId).includes(p.productId)), branchName: (_a = branches.find(branch => branch.id === item.branchId)) === null || _a === void 0 ? void 0 : _a.name, branchAddress: (_b = branches.find(branch => branch.id === item.branchId)) === null || _b === void 0 ? void 0 : _b.address, products: item.products.map(product => {
                    var _a;
                    return Object.assign(Object.assign({}, product), { reviewed: currentOrderReviews.map(review => review.productId).includes(product.productId), cartItemId: product.id, productName: (_a = products.find(pr => pr.id === product.productId)) === null || _a === void 0 ? void 0 : _a.name });
                }) });
        });
        res.status(200).send(userOrdersResult);
    }
    catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}));
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
            data: Object.assign({ id: Math.floor(Math.random() * 1000000000) }, orderPayload),
        })
            .then((order) => __awaiter(void 0, void 0, void 0, function* () {
            cartItems.map((item) => __awaiter(void 0, void 0, void 0, function* () {
                yield db_1.default.orderItem.create({
                    data: {
                        id: Math.floor(Math.random() * 1000000000),
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
            cartItems.forEach((item) => __awaiter(void 0, void 0, void 0, function* () {
                const product = yield db_1.default.product.findFirst({
                    where: {
                        id: item.productId,
                    }
                });
                yield db_1.default.product.update({
                    where: {
                        id: product === null || product === void 0 ? void 0 : product.id,
                    },
                    data: {
                        salesCount: ((product === null || product === void 0 ? void 0 : product.salesCount) || 0) + item.quantity,
                    }
                });
            }));
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
    try {
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
    }
    catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}));
exports.default = router;
