import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import axios from "axios";
import path from "path";
import * as Bytescale from "@bytescale/sdk";
import nodeFetch from "node-fetch";
import fs from "fs";
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import {init} from "../lib/utils/firebaseInit.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/social-media/uploads");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Extract the extension from the original filename
    cb(null, `${Date.now()}-${file.fieldname}${ext}`); // Append the extension to the filename
  },
});
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   storageBucket: 'image-store-13645.appspot.com'
// });
init();
const bucket = admin.storage().bucket();

const upload = multer({ storage });

export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getUserProfile: " + error.message);
    res.status(500).json({ message: error.message });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);
    if (id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You can't follow/unfollow yourself" });
    }
    if (!userToModify || !currentUser) {
      return res.status(400).json({ error: "User not found" });
    }
    const isFollowing = currentUser.following.includes(id);
    if (isFollowing) {
      //UNFOLLOW USER
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      //UNFOLLOW USER
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
      //send notification to the user
      const newNotification = new Notification({
        from: req.user._id,
        to: userToModify._id,
        type: "follow",
      });
      await newNotification.save();

      res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error) {
    console.log("Error in followUnfollowUser: " + error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getSuggestedUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const userFollowByMe = await User.findById(userId).select("following");
    const users = await User.aggregate([
      {
        $match: {
          _id: {
            $ne: userId,
          },
        },
      },
      {
        $sample: {
          size: 10,
        },
      },
    ]);
    const filteredUsers = users.filter(
      (user) => !userFollowByMe.following.includes(user._id)
    );
    const suggestedUsers = filteredUsers.slice(0, 4);
    suggestedUsers.forEach((user) => (user.password = null));
    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log("Error in getSuggestedUser: " + error.message);
    res.status(500).json({ message: error.message });
  }
};


export const updateUser = async (req, res) => {
  const { formData } = req.body;
  console.log(req.body);
  const userId = req.user._id;
  
  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if ((!formData.currentPassword && formData.newPassword) || (formData.currentPassword && !formData.newPassword)) {
      return res.status(400).json({ error: "Please enter both current and new password" });
    }

    if (formData.currentPassword && formData.newPassword) {
      const isMatch = await bcrypt.compare(formData.currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Incorrect password" });
      }
      if (formData.newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(formData.newPassword, salt);
    }

    const uploadImage = async (img, type) => {
      const base64Data = img.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      const mimeType = img.match(/^data:(image\/\w+);base64,/)[1];

      const blob = bucket.file(`${userId}-${type}-${Date.now()}`);
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: mimeType
        }
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
          console.error(`Error uploading ${type}:`, err);
          reject(new Error(`Error uploading ${type}`));
        });

        blobStream.on('finish', async () => {
          try {
            await blob.makePublic();
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            resolve(imageUrl);
          } catch (error) {
            console.error(`Error making ${type} public:`, error);
            reject(new Error(`Error making ${type} public`));
          }
        });

        blobStream.end(buffer);
      });
    };

    let profileImagePath = user.profileImg;
    let coverImagePath = user.converImg;
    

    if (formData.profileImg){
      profileImagePath = await uploadImage(formData.profileImg, 'profile');
      console.log(user.profileImg)
    console.log(profileImagePath)
    }
    
    if (formData.coverImg) {
      coverImagePath = await uploadImage(formData.coverImg, 'cover');
    }
    // console.log(fullName)
    user.fullname = formData.fullName || user.fullname;
    user.email = formData.email || user.email;
    user.username = formData.username || user.username;
    user.bio = formData.bio || user.bio;
    user.link = formData.link || user.link;
    user.profileImg = profileImagePath;
    user.converImg = coverImagePath;
    await user.save();

    return res.send({
      message: "User updated successfully!",
      user: { ...user.toObject(), password: null }  // Exclude password from the response
    });

  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).send({ message: "Error updating user", error: error.message });
  }
};
