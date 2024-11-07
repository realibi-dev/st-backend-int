import { Router, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import prisma from "./../prisma/db";
import dotenv from "dotenv";
import middlewares from "./../middlewares";
import helpers from "../helpers";

dotenv.config();
const router: Router = Router();

const secretKey = process.env.SECRET_KEY;
if (!secretKey) {
    throw new Error('SECRET_KEY not found in environment variables');
}

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

router.get("/getCart", async (req: Request, res: Response) => {
    try {
        const currentUserId = helpers.getCurrentUserInfo(req).id;
    
        const cart = await prisma.cart.findFirst({
            where: {
                userId: currentUserId,
                deletedAt: null
            }
        });
    
        if (cart) {
            const cartItems = await prisma.cartItem.findMany({
                where: {
                    cartId: cart.id,
                    deletedAt: null,
                }
            });

            const products = await prisma.product.findMany({
                where: {
                    id: {
                        in: cartItems.map(item => item.productId),
                    }
                }
            });
    
            res.status(200).send({
                success: true,
                cartId: cart.id,
                items: cartItems.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    return {
                        ...product,
                        cartItemId: item.id,
                        price: item.price || product?.price,
                        quantity: item.quantity,
                    }
                })
            });
        } else {
            res.status(400).send({
                success: false,
                message: "User has no items in cart"
            });
        }
    } catch(error) {
        console.log(error);
        res.status(500).send({ success: false });
    }
})

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
            iat: Date.now(),
        }
        
        const options = {
            expiresIn: '2y',
        }

        const token = jwt.sign(payload, secretKey, options);
        console.log("new token", token);

        res.send({
            user: { ...user, password: undefined },
            token: token,
            success: true,
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
                await prisma.branch.create({
                    data: {
                        id: Math.floor(Math.random() * 1000000000),
                        name: userInfo.cafeName || '',
                        address: userInfo.cafeAddress || '',
                        contactPerson: userInfo.fullname,
                        contactPhone: userInfo.phone,
                        openTime: userInfo.openTime || '',
                        closeTime: userInfo.closeTime || '',
                        userId: user.id,
                    }
                });
                console.log("Branch created for user " + userInfo.username);
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

        
        res.status(201).send({
            status: 201,
            message: "User created",
        });
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