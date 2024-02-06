import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

const createPost = async (req, res) => {
     const { postedBy, text } = req.body;
     let { img } = req.body;

     try {
          if (!postedBy || !text) {
               return res.status(400).json({ message: "postedBy and text fields required!" });
          }
          // what is postedBy? postedBy is the id of the user who is creating the post
          const user = await User.findById(postedBy);
          if (!user) {
               return res.status(404).json({ message: "User not found!" });
          }

          if (user._id.toString() !== req.user._id.toString()) {
               return res.status(401).json({ message: "Unauthorized to create post!" });
          }

          const maxLength = 500;
          if (text.length > maxLength) {
               return res.status(400).json({ message: `Text length should be less than ${maxLength} characters!` });
          }

          if (img) {
               const uploadedResponse = await cloudinary.uploader.upload(img);
               img = uploadedResponse.secure_url;
          }

          const newPost = new Post({ postedBy, text, img });
          await newPost.save();

          res.status(201).json(newPost);
     } catch (error) {
          console.log(error.message);
          res.status(500).json({ message: error.message });
     }
}

const getPost = async (req, res) => {
     const { id } = req.params;

     try {
          const post = await Post.findById(id);
          if (!post) {
               return res.status(404).json({ message: "Post not found!" });
          }

          res.status(200).json(post);
     } catch (error) {
          console.log(error.message);
          res.status(500).json({ message: error.message });
     }
}

const deletePost = async (req, res) => {
     const { id } = req.params;

     try {
          const post = await Post.findById(id);
          if (!post) {
               return res.status(404).json({ message: "Post not found!" });
          }

          if (post.postedBy.toString() !== req.user._id.toString()) {
               return res.status(401).json({ message: "Unauthorized to delete post!" });
          }

          if (post.img) {
               const imgId = post.img.split("/").pop().split(".")[0];
               await cloudinary.uploader.destroy(imgId);
          }

          await Post.findByIdAndDelete(id);

          res.status(200).json({ message: "Post deleted successfully!" });
     } catch (error) {
          console.log(error.message);
          res.status(500).json({ message: error.message });
     }
}

const likeAndUnlikePost = async (req, res) => {
     const { id: postId } = req.params;  // why id: postId? axcept {postId} because we are using id as a variable name in the url
     const userId = req.user._id;
     try {
          const post = await Post.findById(postId);

          if (!post) {
               return res.status(404).json({ message: "Post not found!" });
          }

          const isLiked = post.likes.includes(userId);
          if (isLiked) {
               // unlike post
               await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
               res.status(200).json({ message: "Post unliked successfully!" });
          } else {
               // like post
               post.likes.push(userId);
               await post.save();
               res.status(200).json({ message: "Post liked successfully!" });
          }
     } catch (error) {
          console.log(error.message);
          res.status(500).json({ message: error.message });
     }
}

const replyToPost = async (req, res) => {
     try {
          const { text } = req.body;
          const postId = req.params.id;
          const userId = req.user._id;
          const userProfilePic = req.user.profilePic;
          const username = req.user.username;

          if (!text) {
               return res.status(400).json({ error: "Text field is required" });
          }

          const post = await Post.findById(postId);
          if (!post) {
               return res.status(404).json({ error: "Post not found" });
          }

          const reply = { userId, text, userProfilePic, username };

          post.replies.push(reply);

          await post.save();

          res.status(200).json(reply);
     } catch (err) {
          res.status(500).json({ error: err.message });
     }
};

const getFeedPost = async (req, res) => {
     try {
          const userId = req.user._id;
          const user = await User.findById(userId);
          if (!user) {
               return res.status(404).json({ message: "User not found!" });
          }

          const following = user.following;

          const feedPosts = await Post.find({ postedBy: { $in: following } }).sort({ createdAt: -1 }); // ...following, req.user._id is used to include the posts of the logged in user as well in the feed posts list 

          res.status(200).json(feedPosts);
     } catch (error) {
          console.log(error.message);
          res.status(500).json({ message: error.message });
     }
}

const getUserPosts = async (req, res) => {
     const { username } = req.params;
     try {
          const user = await User.findOne({ username });
          if (!user) {
               return res.status(404).json({ error: "User not found" });
          }

          const posts = await Post.find({ postedBy: user._id }).sort({ createdAt: -1 });

          res.status(200).json(posts);
     } catch (error) {
          res.status(500).json({ error: error.message });
     }
};

export { createPost, getPost, deletePost, likeAndUnlikePost, replyToPost, getFeedPost, getUserPosts };