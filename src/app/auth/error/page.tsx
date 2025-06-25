"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { useSearchParams } from "next/navigation";

const errorMessages = {
  Configuration: "サーバー設定にエラーがあります。管理者にお問い合わせください。",
  AccessDenied: "アクセスが拒否されました。適切な権限がありません。",
  Verification: "認証に失敗しました。再度お試しください。",
  Default: "認証中にエラーが発生しました。再度お試しください。"
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";
  const errorMessage = errorMessages[error as keyof typeof errorMessages] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-tropical-sun/20 via-tropical-teal/10 to-tropical-green/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/90 backdrop-blur-sm border border-tropical-sun/20 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="text-red-500" size={32} />
            </div>
            <CardTitle className="text-2xl font-light text-tropical-teal">
              認証エラー
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
                  ログイン画面に戻る
                </Button>
              </Link>
              <Link href="/">
                <Button 
                  className="w-full gradient-tropical hover:gradient-sunset text-white transition-all duration-300 rounded-xl flex items-center gap-2"
                >
                  <Home size={16} />
                  ホームに戻る
                </Button>
              </Link>
            </div>
            
            <div className="bg-tropical-sun/10 p-4 rounded-xl">
              <h4 className="font-medium text-tropical-teal mb-2">トラブルシューティング</h4>
              <ul className="text-sm text-tropical-teal/70 space-y-1">
                <li>• ブラウザのCookieが有効になっているか確認してください</li>
                <li>• 別のブラウザで試してみてください</li>
                <li>• 問題が続く場合は管理者にお問い合わせください</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
