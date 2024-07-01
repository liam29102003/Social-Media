import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { createPost, deletePost, commentOnPost, likeUnlikePost, getAllPosts, getLikedPosts, getFollowingPosts, getUserPosts }  from '../controllers/post.controller.js';
import multer from 'multer'
import path from 'path'

const router = express.Router();

router.post("/create-post", protectRoute, createPost);
router.post("/like/:id", protectRoute, likeUnlikePost);
router.get("/user/:username", protectRoute, getUserPosts);

router.post("/comment/:id", protectRoute, commentOnPost);
router.delete("/:id", protectRoute, deletePost);
router.get("/all", protectRoute, getAllPosts);
router.get("/following", protectRoute, getFollowingPosts);
router.get("/liked/:id", protectRoute, getLikedPosts)

export default router;
