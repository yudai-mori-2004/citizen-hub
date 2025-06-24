"use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import ProposalCard from "@/components/ProposalCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Proposal {
  id: string;
  title: string;
  status: string;
  description: string;
  vote_count: number;
  support_count: number | null;
  oppose_count: number | null;
  final_result: string | null;
  created_at: string;
  voting_end_date: string;
}

export default function AllProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

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

  const filteredProposals = proposals.filter(proposal => {
    if (filter === "all") return true;
    return proposal.status === filter;
  });

  const getFilterCount = (status: string) => {
    if (status === "all") return proposals.length;
    return proposals.filter(p => p.status === status).length;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">全ての提案</h1>
          <p className="text-center text-muted-foreground">
            住民の皆様からの政策提案を一覧でご確認いただけます
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="flex items-center gap-2"
          >
            全て
            <Badge variant="secondary">{getFilterCount("all")}</Badge>
          </Button>
          <Button
            variant={filter === "Active" ? "default" : "outline"}
            onClick={() => setFilter("Active")}
            className="flex items-center gap-2"
          >
            投票中
            <Badge variant="secondary">{getFilterCount("Active")}</Badge>
          </Button>
          <Button
            variant={filter === "Pending" ? "default" : "outline"}
            onClick={() => setFilter("Pending")}
            className="flex items-center gap-2"
          >
            投票待ち
            <Badge variant="secondary">{getFilterCount("Pending")}</Badge>
          </Button>
          <Button
            variant={filter === "Finalized" ? "default" : "outline"}
            onClick={() => setFilter("Finalized")}
            className="flex items-center gap-2"
          >
            投票終了
            <Badge variant="secondary">{getFilterCount("Finalized")}</Badge>
          </Button>
        </div>

        {/* Proposals Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg">読み込み中...</div>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-lg text-muted-foreground">
              {filter === "all" ? "提案がありません" : `${filter}の提案がありません`}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-12 bg-accent/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">統計情報</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {proposals.length}
              </div>
              <div className="text-sm text-muted-foreground">総提案数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {getFilterCount("Active")}
              </div>
              <div className="text-sm text-muted-foreground">投票中</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {getFilterCount("Pending")}
              </div>
              <div className="text-sm text-muted-foreground">投票待ち</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {getFilterCount("Finalized")}
              </div>
              <div className="text-sm text-muted-foreground">投票終了</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}