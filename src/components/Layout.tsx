// File: src/components/Layout.tsx
import React, { ReactNode } from "react";
import Navbar from "@/components/Navbar";

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main>{children}</main>
        </div>
    );
}
