"use client";

import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/app/components/PasswordInput";

export default function Forgot() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const result = await response.json();
    setBusy(false);
    setMessage(result.error || result.message);
    if (response.ok) setTimeout(() => router.push("/signin"), 900);
  }

  return <main className="auth"><section className="auth-art"><div className="brand"><Sparkles /> ROUTINE FLOW</div><div><p className="eyebrow">RESET YOUR ACCESS</p><h1>A fresh start<br />is one step away.</h1></div></section><section className="auth-form"><div className="form-wrap"><p className="eyebrow">FORGOT PASSWORD</p><h2>Set a new password</h2><p className="muted">No email verification, just as requested.</p><form onSubmit={submit}><label>Email<input name="email" type="email" required suppressHydrationWarning /></label><PasswordInput label="New password" name="newPassword" minLength="6" required />{message && <p className={message.includes("changed") ? "notice" : "error"}>{message}</p>}<button className="primary" disabled={busy} suppressHydrationWarning>{busy ? "Updating…" : "Change password"}<ArrowRight size={18} /></button></form><p className="switch"><a href="/signin">Back to sign in</a></p></div></section></main>;
}
