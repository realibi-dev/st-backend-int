"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const categoryRouter_1 = __importDefault(require("./routers/categoryRouter"));
const userRouter_1 = __importDefault(require("./routers/userRouter"));
const productRouter_1 = __importDefault(require("./routers/productRouter"));
const cartRouter_1 = __importDefault(require("./routers/cartRouter"));
const orderRouter_1 = __importDefault(require("./routers/orderRouter"));
const branchRouter_1 = __importDefault(require("./routers/branchRouter"));
const imageRouter_1 = __importDefault(require("./routers/imageRouter"));
const cartItemRouter_1 = __importDefault(require("./routers/cartItemRouter"));
const providerProfileRouter_1 = __importDefault(require("./routers/providerProfileRouter"));
const productReviewRouter_1 = __importDefault(require("./routers/productReviewRouter"));
const badgeRouter_1 = __importDefault(require("./routers/badgeRouter"));
const globalConfigurationRouter_1 = __importDefault(require("./routers/globalConfigurationRouter"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(body_parser_1.default.json({ limit: '10mb' }));
app.use(body_parser_1.default.urlencoded({ extended: false, limit: '10mb' }));
const corsOptions = {
    origin: 'https://marketly.kz',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use((0, cors_1.default)());
app.use("/api/file", express_1.default.static("./uploads"));
app.use("/api/categories", categoryRouter_1.default);
app.use("/api/users", userRouter_1.default);
app.use("/api/products", productRouter_1.default);
app.use("/api/carts", cartRouter_1.default);
app.use("/api/orders", orderRouter_1.default);
app.use("/api/branches", branchRouter_1.default);
app.use("/api/image", imageRouter_1.default);
app.use("/api/cartItems", cartItemRouter_1.default);
app.use("/api/providers", providerProfileRouter_1.default);
app.use("/api/productReviews", productReviewRouter_1.default);
app.use("/api/badges", badgeRouter_1.default);
app.use("/api/configurations", globalConfigurationRouter_1.default);
app.listen(process.env.PORT);
