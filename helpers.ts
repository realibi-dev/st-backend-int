import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import prisma from "./prisma/db";
dotenv.config();

const toMinutes = (hours: number, minutes: number) => {
    return hours * 60 + minutes;
}

const getGlobalConfigurations = async () => {
    const configurations = await prisma.globalConfiguration.findMany({
        where: {
            deletedAt: null,
        }
    });

    return configurations;
}

const orderDeadlineCheck = async () => {
    const configs = await getGlobalConfigurations();
    const orderStartTime = configs.find(c => c.name === 'ordersAcceptStartTime')?.value;
    const orderEndTime = configs.find(c => c.name === 'ordersAcceptEndTime')?.value;

    if (orderStartTime && orderEndTime) {
        const currentHour = new Date().getHours();
        const currentMinute = new Date().getMinutes();
        const currentTimeInMinutes = toMinutes(currentHour, currentMinute);
        const startTimeInMinutes = toMinutes(+(orderStartTime.split("-")[0]), +(orderStartTime.split("-")[1]));
        const endTimeInMinutes = toMinutes(+(orderEndTime.split("-")[0]), +(orderEndTime.split("-")[1]));
        return startTimeInMinutes < currentTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
    } else {
        return true;
    }
}

const getCurrentUserInfo = (req: Request): any => {
    const bearerToken = req.headers.authorization;
    if (bearerToken) {
        try {
            const token: string = bearerToken.split(" ")[1];
            const userInfo = jwt.verify(token, process.env.SECRET_KEY || "");
            return userInfo;
        } catch (err) {
            console.log(err);
            return null;
        }
    } else {
        return;
    }
}

export default {
    getCurrentUserInfo,
    orderDeadlineCheck,
}