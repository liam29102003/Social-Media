import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js"
import multer from "multer";
import path from "path";
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
export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user._id.toString();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "user not found" });

    if(!text && !img)
        {
            return res.status(400).json({error : "Post must have text or image"});
        }
    if(img)
        {
            const uploadSingle = upload.single("image"); // Change 'profileImg' to 'coverImg' if you want to upload cover images instead

            uploadSingle(req, res, async (err) => {
              if (err) {
                throw err
              }
              const img = req.file.path;

            });
        }
    const newPost = new Post({
        user: userId,
        text,
        img
    });
    await newPost.save();
    res.status(201).json(newPost);
    

   
  } catch (error) {
    console.error("Error creating post:", error);
    return res
      .status(500)
      .send({ message: "Error creating post", error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
      const post = await Post.findById(req.params.id);
      if(!post) return res.status(404).json({error: "Post not found"});
      if(post.user.toString() !== req.user._id.toString())
        {
          return res.status(401).json({error: "You are not authorized"})
        }
        if (post.img) {
          const imagePath = path.join(__dirname, '..', post.imagePath);
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.error("Error deleting image:", err);
              return res.status(500).json({ error: "Error deleting image" });
            }
          });
        }
    
        // Delete the post from the database
        await Post.findByIdAndDelete(req.params.id);
    
        return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res
      .status(500)
      .send({ message: "Error deleting post", error: error.message });
  
  }
}
export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;
    if(!text)
      {
        return res.status(400).json({ error: "Text field is required"});
      }
      const post = await Post.findById(postId);
      if(!post)
        {
          return res.status(404).json({error: "Post not found"});
        }
      const comment = {user:userId, text};
      post.comments.push(comment);
      await post.save();
      res.status(200).json(post);
  } catch (error) {
    console.error("Error creating comment:", error);
    return res
      .status(500)
      .send({ message: "Error creating comment", error: error.message });
  
  }
  }

  export const likeUnlikePost = async (req, res) => {
    try {
      const userId = req.user._id;
      const {id:postId} = req.params;
      const post = await Post.findById(postId);

      if(!post)
        {
          return res.status(404).json({error : "post not found"});
        }
        const userLikedPost = post.likes.includes(userId);
        if(userLikedPost)
          {
            //unlike post
            await Post.updateOne({_id:postId}, {$pull: {likes: userId}});
            await User.updateOne({_id:userId}, {$pull: {likedPosts: postId}})
            res.status(200).json({message: "post unliked successfully"});
          }
          else{
            //like post
            post.likes.push(userId);
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId }});
            await post.save();

            const notification = new Notification({
              from: userId,
              to: post.user,
              type:"like"
            })
            await notification.save()
            res.status(200).json({message: "Post liked successfully"})
          }
    } catch (error) {
    return res
      .status(500)
      .send({ error: "Internal server error"});
  
    }
  }

export const getAllPosts = async (req, res) => {
    try {
      const posts = await Post.find().sort({ createdAt: -1}).populate({
        path:"user",
        select:"-password"
      }).populate({
        path: "comments.user",
        select:"-password"
      });
      if(posts.length === 0)
        {
          return res.status(200).json([])
        }
      res.status(200).json(posts);
    } catch (error) {
      return res
      .status(500)
      .send({ error: "Internal server error"});
  
    
    }
}

export const getLikedPosts = async (req, res) =>{
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    if(!user) return res.status(404).json({error: "User not found"});

    const likedPosts = await Post.find({_id: {$in: user.likedPosts}}).populate({
      path:"user",
      select:"-password"
    }).populate({
      path: "comments.user",
      select:"-password"
    });
    res.status(200).json(likedPosts);
  } catch (error) {
      return res
      .status(500)
      .send({ error: "Internal server error"});
  }
}

export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if(!user) return res.status(404).json({error: "User not found"});
    const following = user.following;
    const feedPosts = await Post.find({user: {$in: following}})
      .sort({ createdAt: -1}).populate({
         path:"user",
         select:"-password"
       }).populate({
         path: "comments.user",
         select:"-password"
       })
    
    res.status(200).json(feedPosts);

  } catch (error) {
    console.log(error);
    return res
    .status(500)
    .send({ error: "Internal server error"});
  }
}
export const getUserPosts = async (req, res) => {
  try {
    const {username} = req.params;
    const user = await User.findOne({username});
    if(!user) return res.status(404).json({error: "User not found"});
    const posts = await Post.find({user: user._id}).sort({ createdAt: -1}).populate({
      path:"user",
      select:"-password"
    }).populate({
      path: "comments.user",
      select:"-password"
    });
    res.status(200).json(posts);
  }
  catch (error) {
    console.log(error);
    return res
    .status(500)
    .send({ error: "Internal server error"});
  }
}