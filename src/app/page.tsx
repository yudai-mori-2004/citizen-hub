// File: src/app/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import ProposalCard from "@/components/ProposalCard";
import { FileText, Trophy, Vote, Clock } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Proposal {
  id: string;
  title: string;
  status: string;
  description: string;
  vote_count: number;
  support_count: number | null;
  oppose_count: number | null;
  final_result: string | null;
  voting_start_date?: string;
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

  const activeProposals = proposals.filter(p => p.status === 'Active');
  const pendingProposals = proposals.filter(p => p.status === 'Pending');
  const approvedProposals = proposals.filter(p => p.status === 'Finalized' && p.final_result === 'approved');

  return (
    <Layout>
      <HeroSection />
      <div className="container mx-auto mt-12 px-4">

        {/* Active Proposals Section */}
        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-tropical-teal mb-3 flex items-center justify-center gap-3">
              <Vote size={28} className="text-tropical-orange" />
              Active Proposals
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-tropical-orange to-tropical-teal mx-auto rounded-full"></div>
            <p className="text-tropical-teal/70 mt-4">Currently accepting votes. Share your opinion on these proposals.</p>
          </div>
          {loading ? (
            <LoadingSpinner size="lg" text="Loading active proposals..." />
          ) : activeProposals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProposals.map((p) => (<ProposalCard key={p.id} proposal={p} />))}
            </div>
          ) : (
            <div className="text-center py-12 bg-tropical-sun/5 rounded-2xl">
              <Vote size={48} className="mx-auto text-tropical-teal/30 mb-4" />
              <p className="text-tropical-teal/60">No active proposals at the moment</p>
            </div>
          )}
        </section>

        {/* Pending Proposals Section */}
        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-tropical-teal mb-3 flex items-center justify-center gap-3">
              <Clock size={28} className="text-tropical-orange" />
              Upcoming Proposals
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-tropical-orange to-tropical-teal mx-auto rounded-full"></div>
            <p className="text-tropical-teal/70 mt-4">Proposals scheduled to start voting soon.</p>
          </div>
          {loading ? (
            <LoadingSpinner size="lg" text="Loading upcoming proposals..." />
          ) : pendingProposals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingProposals.map((p) => (<ProposalCard key={p.id} proposal={p} />))}
            </div>
          ) : (
            <div className="text-center py-12 bg-tropical-sun/5 rounded-2xl">
              <Clock size={48} className="mx-auto text-tropical-teal/30 mb-4" />
              <p className="text-tropical-teal/60">No upcoming proposals</p>
            </div>
          )}
        </section>

        {/* Approved Proposals Section */}
        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-tropical-teal mb-3 flex items-center justify-center gap-3">
              <Trophy size={28} className="text-tropical-green" />
              Approved Proposals
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-tropical-green to-tropical-teal mx-auto rounded-full"></div>
            <p className="text-tropical-teal/70 mt-4">Successfully approved proposals that have been implemented.</p>
          </div>
          {loading ? (
            <LoadingSpinner size="lg" text="Loading approved proposals..." />
          ) : approvedProposals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedProposals.slice(0, 6).map((p) => (<ProposalCard key={p.id} proposal={p} />))}
            </div>
          ) : (
            <div className="text-center py-12 bg-tropical-sun/5 rounded-2xl">
              <Trophy size={48} className="mx-auto text-tropical-teal/30 mb-4" />
              <p className="text-tropical-teal/60">No approved proposals yet</p>
            </div>
          )}
          {approvedProposals.length > 6 && (
            <div className="text-center mt-8">
              <Link href="/all?filter=approved">
                <Button variant="outline" className="border-2 border-tropical-green/30 text-tropical-green hover:bg-tropical-green hover:text-white font-medium px-6 py-3 rounded-2xl transition-all duration-300 flex items-center gap-2 mx-auto">
                  <Trophy size={18} />
                  View More Approved
                </Button>
              </Link>
            </div>
          )}
        </section>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-16">
          <Link href="/all">
            <Button variant="outline" className="border-2 border-tropical-teal/30 text-tropical-teal hover:bg-tropical-teal hover:text-white font-medium px-6 py-3 rounded-2xl transition-all duration-300 flex items-center gap-2">
              <FileText size={18} />
              View All Proposals
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
