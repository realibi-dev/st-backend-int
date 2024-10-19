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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const handleError = (err, res) => {
    console.log(err);
    res
        .status(500)
        .contentType("text/plain")
        .send("Oops! Something went wrong!");
};
const upload = (0, multer_1.default)({
    dest: "./images"
});
router.post("/uploadProductImage", upload.single("image"), (req, res) => {
    var _a, _b;
    const tempPath = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path;
    const random = Math.round(Math.random() * 1000000000).toString();
    const targetPath = path_1.default.join(`./uploads/product_images/${random}.png`);
    const productId = req.body.productId;
    if (path_1.default.extname(((_b = req.file) === null || _b === void 0 ? void 0 : _b.originalname) || "file.png").toLowerCase() === ".png") {
        fs_1.default.rename(tempPath || "", targetPath, (err) => __awaiter(void 0, void 0, void 0, function* () {
            if (err)
                return handleError(err, res);
            yield db_1.default.product.update({
                where: {
                    id: +productId
                },
                data: {
                    image: `http://localhost:8080/file/product_images/${random}.png`,
                }
            })
                .then(() => {
                res
                    .status(200)
                    .contentType("text/plain")
                    .end("File uploaded!");
            })
                .catch(err => {
                handleError(err, res);
            });
        }));
    }
    else {
        fs_1.default.unlink(tempPath || "", err => {
            if (err)
                return handleError(err, res);
            res
                .status(403)
                .contentType("text/plain")
                .end("Only .png files are allowed!");
        });
    }
});
router.post("/uploadUserImage", upload.single("image"), (req, res) => {
    var _a, _b;
    const tempPath = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path;
    const random = Math.round(Math.random() * 1000000000).toString();
    const targetPath = path_1.default.join(`./uploads/user_images/${random}.png`);
    const userId = req.body.userId;
    if (path_1.default.extname(((_b = req.file) === null || _b === void 0 ? void 0 : _b.originalname) || "file.png").toLowerCase() === ".png") {
        fs_1.default.rename(tempPath || "", targetPath, (err) => __awaiter(void 0, void 0, void 0, function* () {
            if (err)
                return handleError(err, res);
            yield db_1.default.user.update({
                where: {
                    id: +userId
                },
                data: {
                    image: `http://localhost:8080/file/user_images/${random}.png`,
                }
            })
                .then(() => {
                res
                    .status(200)
                    .contentType("text/plain")
                    .end("File uploaded!");
            })
                .catch(err => {
                handleError(err, res);
            });
        }));
    }
    else {
        fs_1.default.unlink(tempPath || "", err => {
            if (err)
                return handleError(err, res);
            res
                .status(403)
                .contentType("text/plain")
                .end("Only .png files are allowed!");
        });
    }
});
router.post("/uploadSubCategoryImage", upload.single("image"), (req, res) => {
    var _a, _b;
    const tempPath = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path;
    const random = Math.round(Math.random() * 1000000000).toString();
    const targetPath = path_1.default.join(`./uploads/subcategories_images/${random}.png`);
    const subCategoryId = req.body.subCategoryId;
    if (path_1.default.extname(((_b = req.file) === null || _b === void 0 ? void 0 : _b.originalname) || "file.png").toLowerCase() === ".png") {
        fs_1.default.rename(tempPath || "", targetPath, (err) => __awaiter(void 0, void 0, void 0, function* () {
            if (err)
                return handleError(err, res);
            yield db_1.default.subCategory.update({
                where: {
                    id: +subCategoryId
                },
                data: {
                    image: `http://localhost:8080/file/subcategories_images/${random}.png`,
                }
            })
                .then(() => {
                res
                    .status(200)
                    .contentType("text/plain")
                    .end("File uploaded!");
            })
                .catch(err => {
                handleError(err, res);
            });
        }));
    }
    else {
        fs_1.default.unlink(tempPath || "", err => {
            if (err)
                return handleError(err, res);
            res
                .status(403)
                .contentType("text/plain")
                .end("Only .png files are allowed!");
        });
    }
});
exports.default = router;
