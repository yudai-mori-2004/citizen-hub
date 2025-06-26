"use client";

import React from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Users, Vote, Shield } from "lucide-react";

export default function SignUpPage() {
  const handleGoogleSignUp = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tropical-sun/20 via-tropical-teal/10 to-tropical-green/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/90 backdrop-blur-sm border border-tropical-sun/20 shadow-xl">
          <CardHeader className="text-center pb-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-tropical-teal hover:text-tropical-orange transition-colors duration-300 mb-4 self-start"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>
            <CardTitle className="text-3xl font-light text-tropical-teal">
              <span className="font-semibold">Citizen</span><span className="text-tropical-orange">Hub</span>
            </CardTitle>
            <CardDescription className="text-tropical-teal/70 mt-2">
              Join the democratic decision-making platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-tropical-teal/5 rounded-xl">
                <Vote className="text-tropical-orange" size={20} />
                <span className="text-sm text-tropical-teal/80">Submit proposals and vote</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-tropical-green/5 rounded-xl">
                <Users className="text-tropical-green" size={20} />
                <span className="text-sm text-tropical-teal/80">Shape community decisions</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-tropical-sun/5 rounded-xl">
                <Shield className="text-tropical-sun" size={20} />
                <span className="text-sm text-tropical-teal/80">Secure and transparent voting</span>
              </div>
            </div>

            <Button
              onClick={handleGoogleSignUp}
              variant="outline"
              className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 py-3 rounded-xl flex items-center justify-center gap-3 bg-white"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium">Sign up with Google</span>
            </Button>
            
            <div className="text-center text-sm text-tropical-teal/60">
              <p>
                Already have an account?{" "}
                <Link 
                  href="/auth/signin" 
                  className="text-tropical-orange hover:text-tropical-teal font-medium transition-colors duration-300"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
