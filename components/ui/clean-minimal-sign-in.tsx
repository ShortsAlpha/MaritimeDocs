"use client"

import * as React from "react"
import { useState } from "react";
import { LogIn, Lock, Mail, UserPlus, User, CheckCircle2 } from "lucide-react";
import { useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface AuthFormProps {
    mode: "signin" | "signup";
}

const AuthForm = ({ mode }: AuthFormProps) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [code, setCode] = useState("");
    const { signIn, isLoaded: isSignInLoaded, setActive: setSignInActive } = useSignIn();
    const { signUp, isLoaded: isSignUpLoaded, setActive: setSignUpActive } = useSignUp();
    const { isSignedIn } = useUser();
    const router = useRouter();

    React.useEffect(() => {
        if (isSignedIn) {
            router.push("/admin");
        }
    }, [isSignedIn, router]);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async () => {
        if (!email && !verifying) {
            setError("Please enter email.");
            return;
        }
        if (mode === "signin" && !verifying && !password && !email) {
            setError("Please enter both email and password.");
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        setError("");

        try {
            if (mode === "signin") {
                if (!isSignInLoaded) return;

                try {
                    const result = await signIn.create({
                        identifier: email,
                        password,
                    });

                    if (result.status === "complete") {
                        await setSignInActive({ session: result.createdSessionId });
                        router.push("/admin");
                    } else {
                        console.log("Login result:", result);
                        // If not complete, check factors
                    }
                } catch (err: any) {
                    const errorCode = err.errors?.[0]?.code;
                    // Check if error implies we need another strategy (e.g. no password setup).
                    if (errorCode === "strategy_for_user_invalid" || errorCode === "form_password_missing") {
                        // Expected error for OAuth users trying password login
                        // Fallback to Email Code silently
                        setError("");

                        try {
                            const otpResult = await signIn.create({
                                strategy: "email_code",
                                identifier: email,
                            });

                            if (otpResult.status === "needs_first_factor") {
                                setVerifying(true);
                                // Optional: Inform user why we switched
                                // setError("Password login not available. Please use code."); 
                            }
                        } catch (otpErr: any) {
                            console.error("OTP init error:", otpErr);
                            setError("Could not initiate email verification.");
                        }
                    } else {
                        // Genuine error
                        console.error("Login error:", err);
                        setError(err.errors?.[0]?.message || "Authentication failed");
                    }
                }
            } else {
                if (!isSignUpLoaded) return;
                const result = await signUp.create({
                    emailAddress: email,
                    password,
                });

                if (result.status === "complete") {
                    await setSignUpActive({ session: result.createdSessionId });
                    router.push("/admin");
                } else if (result.status === "missing_requirements") {
                    // Likely email verification needed
                    await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
                    setVerifying(true);
                    setError("Please enter the verification code sent to your email.");
                } else {
                    setError("Sign up failed.");
                }
            }
        } catch (err: any) {
            console.error("Auth error:", err);
            setError(err.errors?.[0]?.message || "Authentication failed");
        }
    };

    const handleVerify = async () => {
        if (!code) {
            setError("Please enter code.");
            return;
        }
        try {
            if (mode === "signin") {
                if (!isSignInLoaded) return;
                const result = await signIn.attemptFirstFactor({
                    strategy: "email_code",
                    code,
                });
                if (result.status === "complete") {
                    await setSignInActive({ session: result.createdSessionId });
                    router.push("/admin");
                } else {
                    console.log(result);
                    setError("Verification failed.");
                }
            } else {
                if (!isSignUpLoaded) return;
                const result = await signUp.attemptEmailAddressVerification({
                    code,
                });
                if (result.status === "complete") {
                    await setSignUpActive({ session: result.createdSessionId });
                    router.push("/admin");
                } else {
                    console.log(result);
                    setError("Verification failed.");
                }
            }
        } catch (err: any) {
            console.error("Verify error:", err);
            setError(err.errors?.[0]?.message || "Verification failed");
        }
    };

    const handleOAuth = async (strategy: any) => {
        if (!signIn) return;
        try {
            await signIn.authenticateWithRedirect({
                strategy,
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/admin",
            });
        } catch (err: any) {
            console.error("OAuth error:", err);
            setError(err.errors?.[0]?.message || "Social login failed");
        }
    };

    return (
        <div className="flex items-center justify-center w-full min-h-screen bg-black z-1">
            <div className="w-full max-w-sm p-8 flex flex-col items-center border rounded-3xl shadow-xl bg-zinc-900/50 border-white/10 shadow-black/50 text-white backdrop-blur-xl">
                <div className="flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-white/5 shadow-lg shadow-black/20 ring-1 ring-white/10 p-4">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
                </div>
                <h2 className="mb-2 text-2xl font-semibold text-center text-white">
                    {verifying ? "Verify Email" : (mode === "signin" ? "Sign in" : "Create account")}
                </h2>
                <p className="mb-6 text-sm text-center text-gray-400">
                    {verifying
                        ? `Enter the code sent to ${email}`
                        : (mode === "signin" ? "Welcome back to Xone Superyacht Academy" : "Join Xone Superyacht Academy today")}
                </p>

                <div className="flex flex-col w-full gap-3 mb-2">
                    {!verifying ? (
                        <>
                            <div className="relative">
                                <span className="absolute -translate-y-1/2 left-3 top-1/2 text-gray-400">
                                    <Mail className="w-4 h-4" />
                                </span>
                                <input
                                    placeholder="Email"
                                    type="email"
                                    value={email}
                                    className="w-full py-2 pl-10 pr-3 text-sm text-white border rounded-xl bg-zinc-800/50 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-gray-500"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute -translate-y-1/2 left-3 top-1/2 text-gray-400">
                                    <Lock className="w-4 h-4" />
                                </span>
                                <input
                                    placeholder="Password"
                                    type="password"
                                    value={password}
                                    className="w-full py-2 pl-10 pr-10 text-sm text-white border rounded-xl bg-zinc-800/50 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-gray-500"
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="relative">
                            <span className="absolute -translate-y-1/2 left-3 top-1/2 text-gray-400">
                                <CheckCircle2 className="w-4 h-4" />
                            </span>
                            <input
                                placeholder="Verification Code"
                                type="text"
                                value={code}
                                className="w-full py-2 pl-10 pr-3 text-sm text-white border rounded-xl bg-zinc-800/50 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-gray-500"
                                onChange={(e) => setCode(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                            />
                        </div>
                    )}

                    <div className="flex justify-end w-full">
                        {error && (
                            <div className="text-sm text-red-400 text-left mr-auto">{error}</div>
                        )}
                        {!verifying && mode === "signin" && (
                            <button className="text-xs font-medium text-gray-400 hover:text-white hover:underline">
                                Forgot password?
                            </button>
                        )}
                    </div>
                </div>

                {!verifying ? (
                    <button
                        onClick={handleSubmit}
                        className="w-full py-2 mt-2 mb-4 font-medium text-black transition shadow cursor-pointer bg-white rounded-xl hover:bg-gray-200"
                    >
                        {mode === "signin" ? "Sign In" : "Sign Up"}
                    </button>
                ) : (
                    <button
                        onClick={handleVerify}
                        className="w-full py-2 mt-2 mb-4 font-medium text-black transition shadow cursor-pointer bg-white rounded-xl hover:bg-gray-200"
                    >
                        Verify Code
                    </button>
                )}

                {!verifying && (
                    <>
                        <div className="flex items-center w-full my-2">
                            <div className="flex-grow border-t border-dashed border-white/10"></div>
                            <span className="mx-2 text-xs text-gray-500">Or {mode === "signin" ? "sign in" : "sign up"} with</span>
                            <div className="flex-grow border-t border-dashed border-white/10"></div>
                        </div>
                        <div className="flex justify-center w-full gap-3 mt-2">
                            <button
                                onClick={() => handleOAuth("oauth_google")}
                                className="flex items-center justify-center transition border border-white/10 grow h-12 rounded-xl bg-white/5 hover:bg-white/10 w-12 text-white"
                            >
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => handleOAuth("oauth_apple")}
                                className="flex items-center justify-center transition border border-white/10 grow h-12 rounded-xl bg-white/5 hover:bg-white/10 w-12 text-white"
                            >
                                <img src="https://www.svgrepo.com/show/511330/apple-173.svg" alt="Apple" className="w-6 h-6 invert" />
                            </button>
                        </div>
                    </>
                )}

                <div id="clerk-captcha"></div>
            </div>
        </div>
    );
};

export { AuthForm };
