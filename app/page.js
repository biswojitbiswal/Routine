import { currentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function Home(){redirect((await currentUserId())?"/dashboard":"/signin")}
