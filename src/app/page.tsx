// File: src/app/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import ProposalCard from "@/components/ProposalCard";
import { FileText, Trophy } from "lucide-react";

interface Proposal {
  id: string;
  title: string;
  status: string;
  description: string;
  vote_count: number;
  support_count: number | null;
  oppose_count: number | null;
  final_result: string | null;
}

export default function HomePage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await fetch('/api/proposals');
      if (response.ok) {
        const data = await response.json();
        setProposals(data.proposals);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <HeroSection />
      <div className="container mx-auto mt-12 px-4">


        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-tropical-teal mb-3">直近の提案</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-tropical-orange to-tropical-teal mx-auto rounded-full"></div>
          </div>
          {loading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {proposals.map((p) => (<ProposalCard key={p.id} proposal={p} />))}
            </div>
          )}
        </section>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-16">
          <Link href="/all">
            <Button variant="outline" className="border-2 border-tropical-teal/30 text-tropical-teal hover:bg-tropical-teal hover:text-white font-medium px-6 py-3 rounded-2xl transition-all duration-300 flex items-center gap-2">
              <FileText size={18} />
              すべての提案を表示
            </Button>
          </Link>
          <Link href="/approved">
            <Button variant="outline" className="border-2 border-tropical-green/30 text-tropical-green hover:bg-tropical-green hover:text-white font-medium px-6 py-3 rounded-2xl transition-all duration-300 flex items-center gap-2">
              <Trophy size={18} />
              採択された提案を見る
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}