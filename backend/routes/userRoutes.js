import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { getUserProfile, followUnfollowUser, getSuggestedUser, updateUser  } from "../controllers/user.controller.js";
import multer from "multer";
import * as Bytescale from '@bytescale/sdk';
import nodeFetch from 'node-fetch';
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '/social-media/uploads')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.originalname)
    }
  })
// const storage = multer.memoryStorage()

  
  const upload = multer({ storage })
const router = express.Router();

const uploadManager = new Bytescale.UploadManager({
    fetchApi: nodeFetch,
    apiKey: 'public_kW15c6wCuYrnvG1Txf8dwRn6fvQ4'
  });
router.get("/profile/:username",protectRoute,  getUserProfile);
router.get("/suggested", protectRoute, getSuggestedUser);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.post('/update',protectRoute, updateUser);

export default router;