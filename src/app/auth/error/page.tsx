"use client";

import React, { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { useSearchParams } from "next/navigation";

const errorMessages = {
  Configuration: "Server configuration error. Please contact administrator.",
  AccessDenied: "Access denied. You don't have proper permissions.",
  Verification: "Authentication failed. Please try again.",
  Default: "An error occurred during authentication. Please try again."
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";
  const errorMessage = errorMessages[error as keyof typeof errorMessages] || errorMessages.Default;

  return (
    <div className="w-full max-w-md">
      <Card className="bg-white/90 backdrop-blur-sm border border-tropical-sun/20 shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="text-red-500" size={32} />
          </div>
          <CardTitle className="text-2xl font-light text-tropical-teal">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-tropical-teal/70 mt-2">
            {errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Link href="/auth/signin">
              <Button 
                variant="outline" 
                className="w-full border-2 border-tropical-teal/30 text-tropical-teal hover:bg-tropical-teal hover:text-white transition-all duration-300 rounded-xl flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </Button>
            </Link>
            <Link href="/">
              <Button 
                className="w-full gradient-tropical hover:gradient-sunset text-white transition-all duration-300 rounded-xl flex items-center gap-2"
              >
                <Home size={16} />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <div className="bg-tropical-sun/10 p-4 rounded-xl">
            <h4 className="font-medium text-tropical-teal mb-2">Troubleshooting</h4>
            <ul className="text-sm text-tropical-teal/70 space-y-1">
              <li>• Make sure cookies are enabled in your browser</li>
              <li>• Try using a different browser</li>
              <li>• Contact administrator if the problem persists</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-tropical-sun/20 via-tropical-teal/10 to-tropical-green/20 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md">
          <Card className="bg-white/90 backdrop-blur-sm border border-tropical-sun/20 shadow-xl">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tropical-teal mx-auto"></div>
                <p className="mt-2 text-tropical-teal">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
