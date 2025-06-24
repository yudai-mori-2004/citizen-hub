"use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import ProposalCard from "@/components/ProposalCard";
import { Badge } from "@/components/ui/badge";
import { Trophy, CheckCircle } from "lucide-react";

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

export default function ApprovedProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedProposals();
  }, []);

  const fetchApprovedProposals = async () => {
    try {
      const response = await fetch('/api/proposals');
      if (response.ok) {
        const data = await response.json();
        // Filter only approved proposals
        const approvedProposals = data.proposals.filter(
          (p: Proposal) => p.status === "Finalized" && p.final_result === "approved"
        );
        setProposals(approvedProposals);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const totalVotes = proposals.reduce((sum, p) => sum + p.vote_count, 0);
  const averageSupport = proposals.length > 0 
    ? proposals.reduce((sum, p) => {
        const supportRate = p.support_count && p.vote_count > 0 
          ? p.support_count / p.vote_count 
          : 0;
        return sum + supportRate;
      }, 0) / proposals.length 
    : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">採択された提案</h1>
          <p className="text-center text-muted-foreground">
            住民投票で可決され、実施が決定した政策提案の履歴です
          </p>
        </div>

        {/* Success Stats */}
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center text-green-800 flex items-center justify-center gap-2">
            <Trophy className="text-green-600" size={20} />
            採択実績サマリー
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600">
                {proposals.length}
              </div>
              <div className="text-sm text-green-700">採択提案数</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {totalVotes.toLocaleString()}
              </div>
              <div className="text-sm text-green-700">総投票数</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {Math.round(averageSupport * 100)}%
              </div>
              <div className="text-sm text-green-700">平均支持率</div>
            </div>
          </div>
        </div>

        {/* Proposals List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg">読み込み中...</div>
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-lg text-muted-foreground mb-4">
              まだ採択された提案がありません
            </div>
            <p className="text-sm text-muted-foreground">
              住民投票で可決された提案がここに表示されます。
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {proposals.map((proposal) => (
                <div key={proposal.id} className="relative">
                  <ProposalCard proposal={proposal} />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-100 text-green-800 shadow-sm flex items-center gap-1">
                      <CheckCircle size={14} />
                      採択済み
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline View */}
            <div className="mt-12">
              <h3 className="text-xl font-semibold mb-6 text-center">採択タイムライン</h3>
              <div className="space-y-4">
                {proposals
                  .sort((a, b) => new Date(b.voting_end_date).getTime() - new Date(a.voting_end_date).getTime())
                  .map((proposal, index) => (
                    <div key={proposal.id} className="flex items-start gap-4 p-4 bg-card rounded-lg border">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-lg">{proposal.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDate(proposal.voting_end_date)} に可決
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium text-green-600">
                              {proposal.support_count}票 賛成
                            </div>
                            <div className="text-muted-foreground">
                              {proposal.oppose_count}票 反対
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {proposal.description}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}