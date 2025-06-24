// File: src/components/HeroSection.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Trophy } from "lucide-react";

export default function HeroSection() {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-tropical-sun/20 via-background to-tropical-teal/10 py-24">
            {/* Decorative elements */}
            <div className="absolute top-10 right-10 w-32 h-32 bg-tropical-orange/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-24 h-24 bg-tropical-green/10 rounded-full blur-2xl"></div>
            
            <div className="container mx-auto px-6 text-center relative z-10">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-light mb-6 leading-tight">
                        <span className="text-tropical-teal font-medium">Citizen</span>
                        <span className="text-tropical-orange font-light">Hub</span>
                        <br />
                        <span className="text-3xl md:text-4xl text-tropical-teal/80 font-light">へようこそ</span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-tropical-teal/70 mb-4 font-light leading-relaxed">
                        トークンをステークして提案を投稿し、
                    </p>
                    <p className="text-xl md:text-2xl text-tropical-teal/70 mb-12 font-light leading-relaxed">
                        コミュニティで民主的に投票しましょう
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/proposal/submit">
                            <Button size="lg" className="gradient-tropical hover:gradient-sunset text-white font-medium px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3">
                                <Plus size={20} />
                                新しく提案する
                            </Button>
                        </Link>
                        <Link href="/approved">
                            <Button size="lg" variant="outline" className="border-2 border-tropical-teal text-tropical-teal hover:bg-tropical-teal hover:text-white font-medium px-8 py-4 rounded-2xl transition-all duration-300 flex items-center gap-3">
                                <Trophy size={20} />
                                採択された提案を見る
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
            
            {/* Bottom wave decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-r from-tropical-teal/5 via-tropical-sun/5 to-tropical-green/5 transform -skew-y-1"></div>
        </div>
    );
}
