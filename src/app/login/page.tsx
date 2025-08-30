
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-1.5c-.83 0-1.5.67-1.5 1.5V12h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z" fill="#4285F4" stroke="none"/>
    <path d="M21.99 12.21c0-.45-.04-.89-.11-1.32H12v2.45h5.51c-.24 1.58-1.4 2.76-3.01 3.64v2.03h2.6c1.52-1.4 2.4-3.51 2.4-5.8z" fill="#4285F4" stroke="none" />
    <path d="M12 22c2.7 0 4.96-1.13 6.62-3.02l-2.6-2.03c-.88.6-2.01.96-3.22.96-2.58 0-4.78-1.72-5.56-4.02H3.81v2.1C5.46 19.51 8.43 22 12 22z" fill="#34A853" stroke="none" />
    <path d="M6.44 14.16a6.03 6.03 0 0 1 0-4.32V7.74H3.81c-.66 1.3-1.04 2.76-1.04 4.26s.38 2.96 1.04 4.26l2.63-2.1z" fill="#FBBC05" stroke="none" />
    <path d="M12 5.25c1.44 0 2.7.5 3.69 1.44L18.17 4.2C16.5 2.65 14.37 2 12 2 8.43 2 5.46 4.49 3.81 7.74l2.63 2.1c.78-2.3 2.98-4.02 5.56-4.02z" fill="#EA4335" stroke="none" />
  </svg>
);


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const ADMIN_EMAIL = "admin@pabnamart.com";
    const ADMIN_PASSWORD = "@Admin#PabnaMart";

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        localStorage.setItem('isAdmin', 'true');
        toast({
            title: "Admin Login Successful",
            description: "Welcome to the Admin Panel!",
        });
        router.push("/admin");
        setIsLoading(false);
        return;
    }

    try {
      await login(email, password);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push("/");
    } catch (error: any) {
      setError(error.message || "Failed to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      toast({
        title: "Login Successful",
        description: "Welcome!",
      });
      router.push("/");
    } catch (error: any) {
      setError(error.message || "Failed to sign in with Google.");
    } finally {
      setIsGoogleLoading(false);
    }
  };


  return (
    <div className="bg-purple-50/30 min-h-screen flex items-center justify-center p-4">
      <Card className="mx-auto max-w-sm w-full shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">Welcome Back!</CardTitle>
          <CardDescription>
            Sign in to your PabnaMart account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            <div className="grid gap-2 relative">
                <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"}
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isGoogleLoading}
                placeholder="••••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-7 h-7 w-7 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : "Sign In"}
            </Button>
          </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <GoogleIcon />
                )}
                Sign in with Google
            </Button>
          
            <div className="mt-4 text-center text-sm">
                Don't have an account?{" "}
                <Link href="/signup" passHref className="font-semibold text-primary hover:underline">
                Sign up
                </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
