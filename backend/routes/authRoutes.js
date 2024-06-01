import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { signup, login, logout, getMe } from "../controllers/auth.controller.js";
const router = express.Router();

// pCaDUSm0DoGikM0c

router.get('/me',protectRoute,getMe)
router.post("/signup", signup);

router.post("/login", login);

router.post("/logout", logout);


export default router;