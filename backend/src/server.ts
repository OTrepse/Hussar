import "reflect-metadata";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import {RegisterRoutes} from "./generated/routes.js";

// THIS IS BASICALLY WHERE THE APP BACKEND STARTS UP
// IT REGISTERS ROUTES, MIDDLEWARE, STARTS HOSTING,
// AND ANYTHING ELSE THAT TAKES PLACE AFTER npm run dev
dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const apiRouter = express.Router();

RegisterRoutes(apiRouter);

app.use("/api", apiRouter);

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});