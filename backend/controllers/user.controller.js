import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import axios from "axios";
import path from "path";
import * as Bytescale from "@bytescale/sdk";
import nodeFetch from "node-fetch";
import fs from "fs";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/social-media/uploads");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Extract the extension from the original filename
    cb(null, `${Date.now()}-${file.fieldname}${ext}`); // Append the extension to the filename
  },
});

const upload = multer({ storage });
// const uploadManager = new Bytescale.UploadManager({
//   fetchApi: nodeFetch,
//   apiKey: "public_kW15c6wCuYrnvG1Txf8dwRn6fvQ4",
// });
// const uploadToByteScale = async (file) => {
//   const fileStream = fs.createReadStream(file.path);
//   const { fileUrl, filePath } = await uploadManager.upload({
//     data: fileStream,
//     mime: file.mimetype,
//     originalFileName: file.originalname,
//     size: file.size, // Include the size if the 'data' is a stream
//   });
//   fs.unlinkSync(file.path); // Remove the file from the server
//   return { fileUrl, filePath };
// };
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

/////////////////////upload to bytescale//////////////////////
// export const updateUser = async (req, res) => {
//     const uploadFields = upload.fields([
//       { name: 'profileImg', maxCount: 1 },
//       { name: 'coverImg', maxCount: 1 }
//     ]);

//     uploadFields(req, res, async (err) => {
//       if (err) {
//         return res.status(400).send({ message: 'Error uploading files', error: err });
//       }

//       const files = req.files;
//       let profileImageResult, coverImageResult;

//       try {
//         if (files.profileImg) {
//           profileImageResult = await uploadToByteScale(files.profileImg[0]);
//         }
//         if (files.coverImg) {
//           coverImageResult = await uploadToByteScale(files.coverImg[0]);
//         }

//         // Update user data in the database here
//         // Example: update user record with new profile and cover image URLs
//         const userId = req.user.id; // Assuming user ID is available in the request
//         const updatedData = {
//           ...(profileImageResult && { profileImageUrl: profileImageResult.fileUrl }),
//           ...(coverImageResult && { coverImageUrl: coverImageResult.fileUrl }),
//           // Add other fields you want to update
//         };

//         // Update user in database (replace with actual DB update logic)
//         // await UserModel.update(userId, updatedData);

//         res.send({
//           message: 'User updated successfully!',
//           profileImage: profileImageResult,
//           coverImage: coverImageResult
//         });
//       } catch (error) {
//         console.error('Error updating user:', error);
//         res.status(500).send({ message: 'Error updating user', error: error.message });
//       }
//     });
//   };
export const updateUser = async (req, res) => {
  const { fullname, email, username, currentPassword, newPassword, bio, link, profileImg, coverImg } = req.body;
  console.log(req.body);
  let profileImagePath = "", coverImagePath = "";
  const userId = req.user._id;
  
  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if ((!currentPassword && newPassword) || (currentPassword && !newPassword)) {
      return res.status(400).json({ error: "Please enter both current and new password" });
    }

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Incorrect password" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (profileImg) {
      profileImagePath = path.join(__dirname, profileImg); // Assuming the path is directly provided
    }
    if (coverImg) {
      coverImagePath = path.join(__dirname, coverImg); // Assuming the path is directly provided
    }

    user.fullname = fullname || user.fullname;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImagePath || user.profileImg;
    user.coverImg = coverImagePath || user.coverImg;

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
