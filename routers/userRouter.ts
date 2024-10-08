import { Router, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import prisma from "./../prisma/db";
import dotenv from "dotenv";
import middlewares from "./../middlewares";

dotenv.config();
const router: Router = Router();

const secretKey = process.env.SECRET_KEY || "";

interface IUser {
    username: string;
    password: string;
    accountType: string; // cafeOwner, provider, regularUser
    fullname: string;
    phone: string;
    cafeName: string|undefined; // если регается владелец кофейни
    cafeAddress: string|undefined; // если регается владелец кофейни
    openTime: string|undefined; // если регается владелец кофейни
    closeTime: string|undefined; // если регается владелец кофейни
    providerCompanyName: string|undefined; // если регается поставщик
}

interface IUserAuth {
    username: string;
    password: string;
}

router.get("/", middlewares.checkAdmin, (req: Request, res: Response) => {
    try {
        prisma.user.findMany({
            where: {
                deletedAt: null,
            }
        })
        .then((data) => {
            res.status(200).send(data);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.get("/:id", (req: Request, res: Response) => {
    const id = +req.params.id;

    try {
        prisma.user.findFirst({
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
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.post("/auth", async (req: Request, res: Response) => {
    try {
        const userData: IUserAuth = req.body;

        const user = await prisma.user.findFirst({
            where: {
                deletedAt: null,
                username: userData.username,
                password: userData.password
            }
        });

        if (!user) {
            res.status(400).send("User not found");
            return;
        }

        // creating token
        const payload = {
            ...user,
        }
        
        const options = {
            expiresIn: '2h'
        }

        const token = jwt.sign(payload, secretKey, options);

        res.send({
            user: { ...user, password: undefined },
            token: token
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.post("/register", async (req: Request, res: Response) => {
    try {
        const userInfo: IUser = req.body;

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    {
                        username: userInfo.username,
                    },
                    {
                        phone: userInfo.phone,
                    }
                ]
            }
        });

        if (existingUser) {
            res.status(400).send("User already exists!");
            return;
        }

        const user = await prisma.user.create({
            data: {
                username: userInfo.username,
                password: userInfo.password,
                accountType: userInfo.accountType,
                fullname: userInfo.fullname,
                phone: userInfo.phone,
            },
        })

        switch (userInfo.accountType) {
            case 'cafeOwner':
                prisma.branch.create({
                    data: {
                        name: userInfo.cafeName || '',
                        address: userInfo.cafeAddress || '',
                        contactPerson: userInfo.fullname,
                        contactPhone: userInfo.phone,
                        openTime: userInfo.openTime || '',
                        closeTime: userInfo.closeTime || '',
                        userId: user.id,
                    }
                })
                .then(() => {
                    console.log("Branch created for user " + userInfo.username);
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).send("Server error. Please try later");
                });
            break;
            case 'provider':
                prisma.providerProfile.create({
                    data: {
                        name: userInfo.providerCompanyName || "",
                        userId: user.id,
                    }
                })
                .then(() => {
                    console.log("Provider profile created for user " + userInfo.username);
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).send("Server error. Please try later");
                });
            break;
            case 'regularUser':

            break;
        }

        
        res.status(201).send("User created");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.delete("/:id", (req: Request, res: Response) => {
    const id = +req.params.id;

    try {
        prisma.user.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date()
            }
        })
        .then((data) => {
            res.status(200).send("User deleted");
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

export default router;