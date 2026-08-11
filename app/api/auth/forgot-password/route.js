import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
export async function POST(req){const {email,newPassword}=await req.json();if(!email||!newPassword||newPassword.length<6)return NextResponse.json({error:"Use your email and a new password of at least 6 characters."},{status:400});const database=await db(),user=await database.collection("users").findOne({email:email.toLowerCase()});if(!user)return NextResponse.json({error:"No account was found for that email."},{status:404});await database.collection("users").updateOne({_id:user._id},{$set:{password:await bcrypt.hash(newPassword,12)}});return NextResponse.json({ok:true,message:"Password changed. You can sign in now."})}
