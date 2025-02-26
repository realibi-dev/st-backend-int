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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./prisma/db"));
dotenv_1.default.config();
const toMinutes = (hours, minutes) => {
    return hours * 60 + minutes;
};
const getGlobalConfigurations = () => __awaiter(void 0, void 0, void 0, function* () {
    const configurations = yield db_1.default.globalConfiguration.findMany({
        where: {
            deletedAt: null,
        }
    });
    return configurations;
});
const orderDeadlineCheck = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const configs = yield getGlobalConfigurations();
    const orderStartTime = (_a = configs.find(c => c.name === 'ordersAcceptStartTime')) === null || _a === void 0 ? void 0 : _a.value;
    const orderEndTime = (_b = configs.find(c => c.name === 'ordersAcceptEndTime')) === null || _b === void 0 ? void 0 : _b.value;
    if (orderStartTime && orderEndTime) {
        const currentHour = new Date().getHours();
        const currentMinute = new Date().getMinutes();
        const currentTimeInMinutes = toMinutes(currentHour, currentMinute);
        const startTimeInMinutes = toMinutes(+(orderStartTime.split("-")[0]), +(orderStartTime.split("-")[1]));
        const endTimeInMinutes = toMinutes(+(orderEndTime.split("-")[0]), +(orderEndTime.split("-")[1]));
        return startTimeInMinutes < currentTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
    }
    else {
        return true;
    }
});
const getCurrentUserInfo = (req) => {
    const bearerToken = req.headers.authorization;
    if (bearerToken) {
        const token = bearerToken.split(" ")[1];
        let userInfo;
        jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY || "", function (err, decoded) {
            if (err) {
                console.log("err", err);
                return;
            }
            // console.log("decoded", decoded);
            userInfo = decoded;
        });
        return userInfo;
    }
    else {
        return;
    }
};
exports.default = {
    getCurrentUserInfo,
    orderDeadlineCheck,
};
