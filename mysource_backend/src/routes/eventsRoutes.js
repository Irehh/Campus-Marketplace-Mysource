import express from "express"
import { eventsHandler } from "../controllers/eventsController.js"

const router = express.Router()

router.get("/", eventsHandler)

export default router

