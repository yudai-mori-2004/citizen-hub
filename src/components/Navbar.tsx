"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
    NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
    Home,
    FileText,
    Plus,
    Menu,
    LogIn,
    User,
    Coins,
    BarChart3,
    Gift,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import WalletButton from "./WalletButton";
import PROSBalance from "./PROSBalance";

interface UserBalance {
    balance: number;
    user_id: string;
}

export default function Navbar() {
    const { data: session, status } = useSession();
    const [userBalance, setUserBalance] = useState<UserBalance | null>(null);

    useEffect(() => {
        if (session) {
            fetchUserBalance();
        }
    }, [session]);

    const fetchUserBalance = async () => {
        try {
            const response = await fetch("/api/user/balance");
            if (response.ok) {
                const data = await response.json();
                setUserBalance(data);
            }
        } catch (error) {
            console.error("Error fetching user balance:", error);
        }
    };

    return (
        <nav className="bg-white/90 backdrop-blur-sm border-b border-tropical-sun/20 sticky top-0 z-50 overflow-visible">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Link href="/" className="text-2xl font-light text-tropical-teal hover:text-tropical-orange transition-colors duration-300">
                    <span className="font-semibold">Citizen</span><span className="text-tropical-orange">Hub</span>
                </Link>

                {/* Main Navigation & User Controls - Simplified */}
                <div className="flex items-center gap-3">
                    {status === "loading" ? (
                        <div className="w-16 h-8 rounded-xl bg-tropical-teal/20 animate-pulse" />
                    ) : session ? (
                        <>
                            {/* User Menu - Simplified */}
                            <NavigationMenu>
                                <NavigationMenuList>
                                    <NavigationMenuItem>
                                        <NavigationMenuTrigger className="bg-tropical-teal/10 text-tropical-teal hover:bg-tropical-teal hover:text-white transition-all duration-300 rounded-xl px-3 py-2 flex items-center gap-2">
                                            <User size={16} />
                                            <span className="hidden sm:inline text-sm">{session.user?.name?.split(' ')[0]}</span>
                                        </NavigationMenuTrigger>
                                        <NavigationMenuContent>
                                            <div className="flex flex-col space-y-1 p-3 min-w-[200px] bg-white/95 backdrop-blur-sm border border-tropical-sun/20 rounded-xl shadow-lg">
                                                {/* Core Navigation */}
                                                <NavigationMenuLink asChild>
                                                    <Link href="/" className="block px-3 py-2 rounded-lg hover:bg-tropical-sun/20 transition-colors duration-200">
                                                        <span className="flex items-center gap-2 text-sm text-tropical-teal">
                                                            <Home size={14} />
                                                            Home
                                                        </span>
                                                    </Link>
                                                </NavigationMenuLink>
                                                <NavigationMenuLink asChild>
                                                    <Link href="/all" className="block px-3 py-2 rounded-lg hover:bg-tropical-sun/20 transition-colors duration-200">
                                                        <span className="flex items-center gap-2 text-sm text-tropical-teal">
                                                            <FileText size={14} />
                                                            All Proposals
                                                        </span>
                                                    </Link>
                                                </NavigationMenuLink>
                                                <NavigationMenuLink asChild>
                                                    <Link href="/dashboard" className="block px-3 py-2 rounded-lg hover:bg-tropical-sun/20 transition-colors duration-200">
                                                        <span className="flex items-center gap-2 text-sm text-tropical-teal">
                                                            <BarChart3 size={14} />
                                                            Dashboard
                                                        </span>
                                                    </Link>
                                                </NavigationMenuLink>

                                                {/* Divider */}
                                                <div className="border-t border-tropical-sun/20 my-1"></div>

                                                {/* PROS Actions */}
                                                <NavigationMenuLink asChild>
                                                    <Link href="/airdrop" className="block px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors duration-200">
                                                        <span className="flex items-center gap-2 text-sm text-purple-600">
                                                            <Gift size={14} />
                                                            Get Free PROS
                                                        </span>
                                                    </Link>
                                                </NavigationMenuLink>

                                                {/* Logout */}
                                                <div className="border-t border-tropical-sun/20 pt-1 mt-1">
                                                    <button
                                                        onClick={() => signOut({ callbackUrl: "/" })}
                                                        className="w-full px-3 py-2 rounded-lg hover:bg-red-50 transition-colors duration-200 text-left"
                                                    >
                                                        <span className="flex items-center gap-2 text-sm text-red-600">
                                                            <LogIn size={14} className="rotate-180" />
                                                            Logout
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        </NavigationMenuContent>
                                    </NavigationMenuItem>
                                </NavigationMenuList>
                            </NavigationMenu>

                            {/* Wallet Connection */}
                            <WalletButton />
                        </>
                    ) : (
                        /* Not logged in - Essential actions only */
                        <div className="flex items-center gap-2">
                            <Link href="/all">
                                <Button variant="ghost" size="sm" className="text-tropical-teal hover:bg-tropical-teal/10 rounded-xl">
                                    Browse
                                </Button>
                            </Link>
                            <Link href="/auth/signin">
                                <Button size="sm" className="gradient-tropical text-white rounded-xl flex items-center gap-2">
                                    <LogIn size={14} />
                                    Login
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
