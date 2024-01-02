// model like tables in sql
// schema like columns in sql

import mongoose from 'mongoose';

const userSchema = mongoose.Schema(
     {
          name: {
               type: String,
               required: true,
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
               minLength: 6,
          },
          profilePic: {
               type: String,
               default: "",
          },
          followers: {
               type: [String],
               default: [],
          },
          following: {
               type: [String],
               default: [],
          },
          bio: {
               type: String,
               default: "",
          },
     },
     {
          timestamps: true,
     }
);

const User = mongoose.model("User", userSchema);
// name of model is alwasys singular and first letter is capital. It will create a collection named users in the database and store the documents in it. If the collection does not exist, it will create it. If the collection already exists, it will not create it. It will just insert the documents in it.   


export default User;