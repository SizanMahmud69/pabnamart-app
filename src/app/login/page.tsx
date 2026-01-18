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
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { User as AppUser } from '@/types';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
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
      const userCredential = await login(email, password);
      const db = getFirestore(app);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as AppUser;
          if (userData.role === 'moderator') {
              localStorage.setItem('isModerator', 'true');
              localStorage.setItem('moderatorPermissions', JSON.stringify(userData.permissions || {}));
              toast({
                  title: "Moderator Login Successful",
                  description: "Welcome to the Admin Panel!",
              });
              router.push("/admin");
              return;
          }
      }

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


  return (
    <div className="bg-purple-50/30 flex justify-center p-4 pt-16">
      <Card className="mx-auto max-w-sm w-full shadow-lg h-fit">
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
                disabled={isLoading}
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
                disabled={isLoading}
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : "Sign In"}
            </Button>
          </form>
          
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
