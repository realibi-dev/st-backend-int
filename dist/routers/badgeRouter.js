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
const productRouter_1 = require("./productRouter");
const helpers_1 = __importDefault(require("../helpers"));
const router = (0, express_1.Router)();
router.get("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const searchName = req.query.name;
        const badge = yield db_1.default.badge.findFirst({
            where: {
                name: searchName,
                // deletedAt: null,
            }
        });
        if (!badge) {
            return res.status(400).json({ message: "Badge not found" });
        }
        const productsOfBadge = yield db_1.default.productBadge.findMany({
            where: {
                deletedAt: null,
                badgeId: badge.id,
            }
        });
        const providers = yield db_1.default.providerProfile.findMany({
            where: {
                deletedAt: null
            },
        });
        const availableProviders = yield (0, productRouter_1.getAvailableProviders)();
        let products = yield db_1.default.product.findMany({
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
            var _a;
            return Object.assign(Object.assign({}, product), { providerName: (_a = providers.find(p => p.id === product.providerId)) === null || _a === void 0 ? void 0 : _a.name });
        });
        res.status(200).send(products);
    }
    catch (e) {
        res.status(500).json(e);
        console.log(e);
    }
}));
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const badges = yield db_1.default.badge.findMany({
            where: {
                deletedAt: null,
            }
        });
        res.status(200).json(badges);
    }
    catch (e) {
        res.status(500).json(e);
        console.log(e);
    }
}));
router.get("/:badgeId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const badgeId = req.params.badgeId;
        let badge = yield db_1.default.badge.findFirst({
            where: {
                deletedAt: null,
                id: +badgeId,
            }
        });
        if (!badge)
            return res.status(404).json({ message: "No badge found" });
        const productsOfBadge = yield db_1.default.productBadge.findMany({
            where: {
                deletedAt: null,
                badgeId: +badgeId,
            }
        });
        const providers = yield db_1.default.providerProfile.findMany({
            where: {
                deletedAt: null
            },
        });
        const availableProviders = yield (0, productRouter_1.getAvailableProviders)();
        let products = yield db_1.default.product.findMany({
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
            var _a;
            return Object.assign(Object.assign({}, product), { providerName: (_a = providers.find(p => p.id === product.providerId)) === null || _a === void 0 ? void 0 : _a.name });
        });
        const currentUserId = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = helpers_1.default.getCurrentUserInfo(req)) === null || _b === void 0 ? void 0 : _b.id);
        console.log("current user id", currentUserId);
        if (currentUserId) {
            const newPriceProducts = yield db_1.default.productNewPrice.findMany({
                where: {
                    deletedAt: null,
                    userId: currentUserId
                }
            });
            if (newPriceProducts.length) {
                const productsWithUpdatedPrices = products.map(product => {
                    var _a;
                    return Object.assign(Object.assign({}, product), { price: ((_a = newPriceProducts.find(item => item.productId === product.id)) === null || _a === void 0 ? void 0 : _a.price) || product.price });
                });
                res.status(200).send(productsWithUpdatedPrices);
                return;
            }
        }
        res.status(200).send({
            badgeName: badge.name,
            products,
        });
    }
    catch (e) {
        res.status(500).json(e);
        console.log(e);
    }
}));
exports.default = router;
