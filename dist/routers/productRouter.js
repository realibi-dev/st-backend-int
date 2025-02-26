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
exports.getAvailableProviders = getAvailableProviders;
const express_1 = require("express");
const db_1 = __importDefault(require("../prisma/db"));
const helpers_1 = __importDefault(require("./../helpers"));
const moment_1 = __importDefault(require("moment"));
const router = (0, express_1.Router)();
function getAvailableProviders() {
    return __awaiter(this, void 0, void 0, function* () {
        const currentDay = (0, moment_1.default)().format("dddd");
        const providers = yield db_1.default.providerProfile.findMany({ where: { deletedAt: null } });
        const availableProviders = providers.filter(provider => {
            return !provider.workDays || provider.workDays.includes(currentDay);
        });
        return availableProviders;
    });
}
router.get('/filterData', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const providers = yield db_1.default.providerProfile.findMany({ where: { deletedAt: null } });
        const subCategories = yield db_1.default.subCategory.findMany({ where: { deletedAt: null } });
        const maxPrice = yield db_1.default.product.findFirst({ where: { deletedAt: null }, orderBy: { price: 'desc' } });
        const minPrice = yield db_1.default.product.findFirst({ where: { deletedAt: null }, orderBy: { price: 'asc' } });
        res.status(200).send({
            providers,
            subCategories,
            maxPrice: maxPrice === null || maxPrice === void 0 ? void 0 : maxPrice.price,
            minPrice: minPrice === null || minPrice === void 0 ? void 0 : minPrice.price,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
}));
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const availableProviders = yield getAvailableProviders();
        let data = yield db_1.default.product.findMany({
            where: {
                deletedAt: null,
                providerId: { in: availableProviders.map(provider => provider.id) },
            },
            orderBy: [
                { orderCoefficient: 'desc' },
                { rating: 'desc' },
                { reviewsCount: 'desc' },
            ]
        });
        const currentUserId = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = helpers_1.default.getCurrentUserInfo(req)) === null || _b === void 0 ? void 0 : _b.id);
        if (currentUserId) {
            const newPriceProducts = yield db_1.default.productNewPrice.findMany({
                where: {
                    deletedAt: null,
                    userId: currentUserId
                },
            });
            if (newPriceProducts.length) {
                let productsWithUpdatedPrices = data.map(product => {
                    var _a;
                    return Object.assign(Object.assign({}, product), { price: ((_a = newPriceProducts.find(item => item.productId === product.id)) === null || _a === void 0 ? void 0 : _a.price) || product.price });
                });
                res.status(200).send(productsWithUpdatedPrices);
                return;
            }
        }
        const productBadgeRelations = yield db_1.default.productBadge.findMany({
            where: {
                deletedAt: null,
                productId: {
                    in: data.map(product => product.id),
                }
            }
        });
        const badges = yield db_1.default.badge.findMany({
            where: {
                deletedAt: null,
                id: {
                    in: productBadgeRelations.map(pb => pb.badgeId),
                }
            }
        });
        const badgeWithProductIds = badges.map(badge => {
            return Object.assign(Object.assign({}, badge), { productIds: productBadgeRelations
                    .filter(pb => pb.badgeId === badge.id)
                    .map(pb => pb.productId) });
        });
        data = data.map(product => {
            var _a;
            return (Object.assign(Object.assign({}, product), { providerName: (_a = availableProviders.find(p => p.id === product.providerId)) === null || _a === void 0 ? void 0 : _a.name, 
                // @ts-ignore
                badges: badgeWithProductIds.reduce((acc, item) => {
                    if (item.productIds.includes(product.id)) {
                        return [...acc, item.name];
                    }
                    else {
                        return acc;
                    }
                }, []) }));
        });
        res.status(200).send(data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
}));
router.post("/filter", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const filters = req.body;
        const searchConditions = {
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
        }
        else if ("minPrice" in filters) {
            // @ts-ignore
            searchConditions.price = { gte: +filters.minPrice };
        }
        else if ("maxPrice" in filters) {
            // @ts-ignore
            searchConditions.price = { lte: +filters.maxPrice };
        }
        let availableProviders = yield getAvailableProviders();
        if ("providerIds" in filters) {
            availableProviders = availableProviders.filter(provider => { var _a; return (_a = filters.providerIds) === null || _a === void 0 ? void 0 : _a.includes(provider.id); });
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
            };
        }
        let products = yield db_1.default.product.findMany({
            orderBy: [
                { orderCoefficient: 'desc' },
                { rating: 'desc' },
                { reviewsCount: 'desc' },
                sortingMethod,
            ],
            where: Object.assign(Object.assign({}, searchConditions), { providerId: { in: availableProviders.map(item => item.id) } }),
        });
        if ("name" in filters) {
            // @ts-ignore
            products = products.filter(product => product.name.toLowerCase().includes(filters.name.toLowerCase()));
        }
        const productBadgeRelations = yield db_1.default.productBadge.findMany({
            where: {
                deletedAt: null,
                productId: {
                    in: products.map(product => product.id),
                }
            }
        });
        const badges = yield db_1.default.badge.findMany({
            where: {
                deletedAt: null,
                id: {
                    in: productBadgeRelations.map(pb => pb.badgeId),
                }
            }
        });
        const badgeWithProductIds = badges.map(badge => {
            return Object.assign(Object.assign({}, badge), { productIds: productBadgeRelations
                    .filter(pb => pb.badgeId === badge.id)
                    .map(pb => pb.productId) });
        });
        const providers = yield db_1.default.providerProfile.findMany({
            where: {
                deletedAt: null
            },
        });
        products = products.map(product => {
            var _a;
            return (Object.assign(Object.assign({}, product), { providerName: (_a = providers.find(p => p.id === product.providerId)) === null || _a === void 0 ? void 0 : _a.name, 
                // @ts-ignore
                badges: badgeWithProductIds.reduce((acc, item) => {
                    if (item.productIds.includes(product.id)) {
                        return [...acc, item.name];
                    }
                    else {
                        return acc;
                    }
                }, []) }));
        });
        const currentUserId = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = helpers_1.default.getCurrentUserInfo(req)) === null || _b === void 0 ? void 0 : _b.id);
        if (currentUserId) {
            const newPriceProducts = yield db_1.default.productNewPrice.findMany({
                where: {
                    deletedAt: null,
                    userId: +currentUserId
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
        res.status(200).send(products);
    }
    catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
}));
router.get("/subCategory/:subCategoryId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const subCategoryId = +req.params.subCategoryId;
        const availableProviders = yield getAvailableProviders();
        let data = yield db_1.default.product.findMany({
            where: {
                deletedAt: null,
                subCategoryId,
                providerId: { in: availableProviders.map(item => item.id) },
            }
        });
        const currentUserId = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = helpers_1.default.getCurrentUserInfo(req)) === null || _b === void 0 ? void 0 : _b.id);
        if (currentUserId) {
            const newPriceProducts = yield db_1.default.productNewPrice.findMany({
                where: {
                    deletedAt: null,
                    userId: currentUserId
                }
            });
            if (newPriceProducts.length) {
                const productsWithUpdatedPrices = data.map(product => {
                    var _a;
                    return Object.assign(Object.assign({}, product), { price: ((_a = newPriceProducts.find(item => item.productId === product.id)) === null || _a === void 0 ? void 0 : _a.price) || product.price });
                });
                res.status(200).send(productsWithUpdatedPrices);
                return;
            }
        }
        const productBadgeRelations = yield db_1.default.productBadge.findMany({
            where: {
                deletedAt: null,
                productId: {
                    in: data.map(product => product.id),
                }
            }
        });
        const badges = yield db_1.default.badge.findMany({
            where: {
                deletedAt: null,
                id: {
                    in: productBadgeRelations.map(pb => pb.badgeId),
                }
            }
        });
        const badgeWithProductIds = badges.map(badge => {
            return Object.assign(Object.assign({}, badge), { productIds: productBadgeRelations
                    .filter(pb => pb.badgeId === badge.id)
                    .map(pb => pb.productId) });
        });
        const providers = yield db_1.default.providerProfile.findMany({
            where: {
                deletedAt: null
            },
        });
        data = data.map(product => {
            var _a;
            return (Object.assign(Object.assign({}, product), { providerName: (_a = providers.find(p => p.id === product.id)) === null || _a === void 0 ? void 0 : _a.name, 
                // @ts-ignore
                badges: badgeWithProductIds.reduce((acc, item) => {
                    if (item.productIds.includes(product.id)) {
                        return [...acc, item.name];
                    }
                    else {
                        return acc;
                    }
                }, []) }));
        });
        res.status(200).send(data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
}));
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const id = +req.params.id;
    try {
        let data = yield db_1.default.product.findFirst({
            where: {
                deletedAt: null,
                id: id,
            }
        });
        const currentUserId = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = helpers_1.default.getCurrentUserInfo(req)) === null || _b === void 0 ? void 0 : _b.id);
        if (currentUserId) {
            const newPriceProduct = yield db_1.default.productNewPrice.findFirst({
                where: {
                    deletedAt: null,
                    userId: currentUserId,
                    productId: id,
                }
            });
            if (newPriceProduct) {
                res.status(200).send(Object.assign(Object.assign({}, data), { price: newPriceProduct.price || (data === null || data === void 0 ? void 0 : data.price) }));
                return;
            }
        }
        const productBadgeRelations = yield db_1.default.productBadge.findMany({
            where: {
                deletedAt: null,
                productId: data === null || data === void 0 ? void 0 : data.id,
            }
        });
        const badges = yield db_1.default.badge.findMany({
            where: {
                deletedAt: null,
                id: {
                    in: productBadgeRelations.map(pb => pb.badgeId),
                }
            }
        });
        const badgeWithProductIds = badges.map(badge => {
            return Object.assign(Object.assign({}, badge), { productIds: productBadgeRelations
                    .filter(pb => pb.badgeId === badge.id)
                    .map(pb => pb.productId) });
        });
        // @ts-ignore
        const _badges = badgeWithProductIds.reduce((acc, item) => {
            // @ts-ignore
            if (item.productIds.includes(data === null || data === void 0 ? void 0 : data.id)) {
                return [...acc, item.name];
            }
            else {
                return acc;
            }
        }, []);
        const providers = yield db_1.default.providerProfile.findMany({
            where: {
                deletedAt: null
            },
        });
        // @ts-ignore
        data.providerName = (_c = providers.find(p => p.id === data.providerId)) === null || _c === void 0 ? void 0 : _c.name;
        res.status(200).send(Object.assign(Object.assign({}, data), { badges: _badges }));
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
}));
router.post("/", (req, res) => {
    try {
        const productInfo = req.body;
        console.log("Product info", productInfo);
        db_1.default.product.create({
            data: Object.assign({ id: Math.floor(Math.random() * 1000000000) }, productInfo),
        })
            .then(() => {
            res.status(201).send("Product created");
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
router.put("/:id", (req, res) => {
    try {
        const id = +req.params.id;
        const productInfo = req.body;
        db_1.default.product.update({
            where: {
                id: id,
            },
            data: Object.assign(Object.assign({}, productInfo), { updatedAt: new Date() }),
        })
            .then(() => {
            res.status(200).send("Product changed");
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
router.delete("/:id", (req, res) => {
    const id = +req.params.id;
    try {
        db_1.default.product.update({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
});
router.post('/changeprice', (req, res) => {
    try {
        const data = req.body;
        db_1.default.productNewPrice.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
});
exports.default = router;
