import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import  {generateTokenAndSetCookie}  from "../lib/utils/generateTokenAndSetCookie.js";

export const signup = async (req, res) => {
   try {
     const { fullname,username,email, password } = req.body;
     console.log(req.body);
     const emailRegx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if(!emailRegx.test(email))
     {
        return res.status(400).json({
          error: "Invalid email address format",
        });
     }
     const existingUser = await User.findOne({ username }); 
     if(existingUser)
        {
            return res.status(400).json({
                error: "Username is already taken",
            })
        }
        const existingEmail = await User.findOne({ email }); 
        if(existingEmail)
           {
               return res.status(400).json({
                   error: "Email is already taken",
               })
           } 
        if(password.length < 6)
            {
                return res.status(400).json({
                    error: "Password must be at least 6 characters long",
                })
            }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = new User({ fullname,username,email, password:hashedPassword });
        if(user)
            {
                generateTokenAndSetCookie(user._id, res);
                await user.save();
                res.status(201).json({
                    message: "User created successfully",
                    fullname: user.fullname,
                    username: user.username,
                    email: user.email,
                    followers: user.followers,
                    following: user.following,
                    profilImg: user.profilImg,
                    converImg: user.converImg,
                });
            }
        else{
            res.status(400).json({
                error: "Something went wrong",
            });
        }
   } catch (error) {
        res.status(500).json({
            error: error.message,
        });
   }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if(!user)
            {
                return res.status(400).json({
                    error: "Invalid username",
                });
            }
        const isPasswordCorrect = await bcrypt.compare(password, user.password || "" );
        if(!isPasswordCorrect)
            {
                return res.status(400).json({
                    error: "Invalid password",
                });
            }

        generateTokenAndSetCookie(user._id, res);
        res.status(200).json({
            message: "User logged in successfully",
            fullname: user.fullname,
            username: user.username,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profilImg: user.profilImg,
            converImg: user.converImg,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: error.message,

        });
        
    }
};

export const logout = async (req, res) => {
    try {
        res.cookie("jwt", "", {
            maxAge: 1,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV !== "development"
        });
        res.status(200).json({
            message: "User logged out successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            error: error.message,

        });
    }
    
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json({user});
    } catch (error) {
        res.status(500).json({
            error: error.message,
    })
    
    }
}
