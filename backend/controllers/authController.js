import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { registerSchema, loginSchema } from "../utils/validator.js";
import {OAuth2Client} from "google-auth-library";

//REGISTER
export const register = async (req, res) => {

  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0].message,
    });
  }
  
  try {
    const { email, username, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
        { id: user._id, username: user.username }, 
        process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    return res.status(201).json({
      message: "User created",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

//LOGIN
export const login = async (req, res) => {

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0].message,
    });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const client= new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth= async(req,res)=>{
  try{
    const {credential} =req.body;
    if(!credential){
      return res.status(400).json({
        message:"No credential provided"
      })
    }

    const ticket=await client.verifyIdToken({
      idToken:credential,
      audience:process.env.GOOGLE_CLIENT_ID
    });

    const payload=ticket.getPayload();

    const {email,name}=payload;

    let user= await User.findOne({email});

    if(!user){
      user = await User.create({
        email,
        username:name,
        password:"google auth"
      })
    }

    const token= jwt.sign(
      {id:user._id,username:user.username},
      process.env.JWT_SECRET,
      {expiresIn:"7d"}
    );

    return res.json({
      message:"Google auth successful",
      token,
      user:{
        id:user._id,
        username:user.username,
        email:user.email
      },
    });
  }
  catch(e){
    return res.status(500).json({
      message:e.message
    })
  }
}
