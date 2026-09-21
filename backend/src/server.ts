import "reflect-metadata";

import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import container from "./bindings.js";
import { UserController } from "./controllers/user_controller.js";
import { TYPES } from "./services/types/types.js";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const userController = container.get<UserController>(
    TYPES.UserController,
);

app.use("/api/users", userController.router);

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});