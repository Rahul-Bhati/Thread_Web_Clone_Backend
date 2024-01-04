import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";

const createPost = async (req, res) => {
     const { postedBy, text, img } = req.body;

     try {
          if (!postedBy || !text) {
               return res.status(400).json({ message: "postedBy and text fields required!" });
          }

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

          const newPost = new Post({ postedBy, text, img });
          await newPost.save();

          res.status(201).json({ message: "Post created successfully!", newPost })
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

          res.status(200).json({ message: "Post found!", post });
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

export { createPost, getPost, deletePost, likeAndUnlikePost };