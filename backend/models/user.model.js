import mongoose from "mongoose";

const useSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      // unique: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId, // 16 characters long string
        ref: "User",
        default: [],
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    profileImg: {
      type: String,
      default: "",
    },
    converImg: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    link: {
      type: String,
      default: "",
    },
    likedPosts:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Post",
        default:[],
      }
    ]
  },
  { timestamps: true }
);
const User =  mongoose.model("User", useSchema);
export default User;
