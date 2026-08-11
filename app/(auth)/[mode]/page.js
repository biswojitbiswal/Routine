"use client";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
export default function Auth() {
    const { mode } = useParams(),
        router = useRouter(),
        [error, setError] = useState(""),
        [busy, setBusy] = useState(false), signup = mode === "signup", forgot = mode === "forgot-password";

    async function submit(e) {
        e.preventDefault();
        setBusy(true); setError(""); const data = Object.fromEntries(new FormData(e.currentTarget)), r = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }), j = await r.json(); setBusy(false); if (!r.ok) return setError(j.error); if (forgot) return setError(j.message); router.push("/dashboard")
    } return <main className="auth">
        <section className="auth-art">
            <div className="brand">
                <Sparkles /> ROUTINE FLOW
            </div>
            <div>
                <p className="eyebrow">MAKE SPACE FOR WHAT MATTERS</p>
                <h1>Build a rhythm<br />you’ll love to keep.</h1>
                <p>One calm, colorful place for all the small things that make up a good life.</p>
            </div>
            <div className="promise"><CheckCircle2 /> Private by design <span>·</span> Simple by default</div>
        </section>
        <section className="auth-form">
            <div className="form-wrap">
                <p className="eyebrow">WELCOME {signup ? "ABOARD" : "BACK"}</p>
                <h2>{signup ? "Create your flow" : forgot ? "Reset your password" : "Good to see you"}</h2>
                <p className="muted">{signup ? "Start with the little things. They add up." : forgot ? "Sign in, then use Change password in Account." : "Your routines are waiting."}</p>
                <form onSubmit={submit}>{signup &&
                    <label>Name<input name="name" placeholder="What should we call you?" required /></label>
                }
                    <label>Email<input name="email" type="email" placeholder="you@example.com" required /></label>
                    {!forgot && <label>Password<input name="password" type="password" minLength="6" placeholder="At least 6 characters" required /></label>}
                    {error && <p className={forgot ? "notice" : "error"}>{error}</p>}
                    <button className="primary" disabled={busy}>{busy ? "Just a moment…" : forgot ? "Send reset guidance" : "Continue"}<ArrowRight size={18} /></button>
                </form>
                <p className="switch">{signup ? "Already have an account?" : "New here?"}
                    <a href={signup ? "/signin" : "/signup"}>{signup ? "Sign in" : "Create an account"}</a>
                </p>{!signup && !forgot && <a className="forgot" href="/forgot-password">Forgot password?</a>
                }
            </div>
        </section>
    </main>
}
