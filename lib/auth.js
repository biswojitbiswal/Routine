import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const key = new TextEncoder().encode(process.env.JWT_SECRET || "development-only-change-this-secret");
export async function setSession(user) { const token = await new SignJWT({ email:user.email, name:user.name }).setProtectedHeader({alg:"HS256"}).setSubject(user._id.toString()).setIssuedAt().setExpirationTime("14d").sign(key); (await cookies()).set("routine_session",token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:1209600,path:"/"}); }
export async function currentUserId() { const token=(await cookies()).get("routine_session")?.value; if(!token)return null; try{return (await jwtVerify(token,key)).payload.sub}catch{return null} }
export async function clearSession(){(await cookies()).delete("routine_session")}
