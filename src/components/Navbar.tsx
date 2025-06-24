// File: src/components/Navbar.tsx
import Link from "next/link";
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
    NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Home, FileText, CheckCircle, Plus, Menu } from "lucide-react";

export default function Navbar() {
    return (
        <nav className="bg-white/90 backdrop-blur-sm border-b border-tropical-sun/20 sticky top-0 z-50">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Link href="/" className="text-2xl font-light text-tropical-teal hover:text-tropical-orange transition-colors duration-300">
                    <span className="font-semibold">Citizen</span><span className="text-tropical-orange">Hub</span>
                </Link>
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="bg-tropical-teal/10 text-tropical-teal hover:bg-tropical-teal hover:text-white transition-all duration-300 rounded-full px-6 flex items-center gap-2">
                                <Menu size={16} />
                                メニュー
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <div className="flex flex-col space-y-1 p-6 min-w-[220px] bg-white/95 backdrop-blur-sm border border-tropical-sun/20 rounded-2xl shadow-lg">
                                    <NavigationMenuLink asChild>
                                        <Link href="/" className="block px-4 py-3 rounded-xl hover:bg-tropical-sun/20 transition-colors duration-200 group">
                                            <span className="flex items-center gap-3">
                                                <Home size={18} className="text-tropical-orange group-hover:scale-110 transition-transform duration-200" />
                                                <span className="text-tropical-teal font-medium">ホーム</span>
                                            </span>
                                        </Link>
                                    </NavigationMenuLink>
                                    <NavigationMenuLink asChild>
                                        <Link href="/all" className="block px-4 py-3 rounded-xl hover:bg-tropical-sun/20 transition-colors duration-200 group">
                                            <span className="flex items-center gap-3">
                                                <FileText size={18} className="text-tropical-orange group-hover:scale-110 transition-transform duration-200" />
                                                <span className="text-tropical-teal font-medium">すべての提案</span>
                                            </span>
                                        </Link>
                                    </NavigationMenuLink>
                                    <NavigationMenuLink asChild>
                                        <Link href="/approved" className="block px-4 py-3 rounded-xl hover:bg-tropical-sun/20 transition-colors duration-200 group">
                                            <span className="flex items-center gap-3">
                                                <CheckCircle size={18} className="text-tropical-green group-hover:scale-110 transition-transform duration-200" />
                                                <span className="text-tropical-teal font-medium">採択された提案</span>
                                            </span>
                                        </Link>
                                    </NavigationMenuLink>
                                    <div className="border-t border-tropical-sun/20 pt-3 mt-3">
                                        <NavigationMenuLink asChild>
                                            <Link href="/proposal/submit" className="block">
                                                <Button size="sm" className="w-full gradient-tropical hover:gradient-sunset text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 shadow-md flex items-center gap-2">
                                                    <Plus size={16} />
                                                    新しく提案する
                                                </Button>
                                            </Link>
                                        </NavigationMenuLink>
                                    </div>
                                </div>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
        </nav>
    );
}
