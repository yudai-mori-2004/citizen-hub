"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { Vote, CheckCircle } from "lucide-react";

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  stake_amount: number;
  status: string;
  voting_end_date: string;
  created_at: string;
  vote_count: number;
  support_rate: number;
}

export default function ProposalVoting() {
  const params = useParams();
  const proposalId = params.id as string;
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [supportLevel, setSupportLevel] = useState(50);
  const [comment, setComment] = useState("");
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    fetchProposal();
  }, [proposalId]);

  const fetchProposal = async () => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}`);
      if (response.ok) {
        const data = await response.json();
        setProposal(data);
      }
    } catch (error) {
      console.error("Error fetching proposal:", error);
    }
  };

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVoting(true);

    try {
      const response = await fetch(`/api/proposals/${proposalId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          support_level: supportLevel,
          comment: comment.trim() || null,
        }),
      });

      if (response.ok) {
        setHasVoted(true);
        alert("投票が完了しました！");
        fetchProposal(); // Refresh proposal data
      } else {
        alert("投票に失敗しました。再度お試しください。");
      }
    } catch (error) {
      alert("エラーが発生しました。再度お試しください。");
    } finally {
      setIsVoting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Finalized": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!proposal) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">読み込み中...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{proposal.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge className={getStatusColor(proposal.status)}>
                      {proposal.status}
                    </Badge>
                    <span>投票終了: {formatDate(proposal.voting_end_date)}</span>
                    <span>現在の投票数: {proposal.vote_count}票</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{proposal.description}</p>
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-md">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">提案者:</span> {proposal.proposer}
                  </div>
                  <div>
                    <span className="font-medium">担保額:</span> {proposal.stake_amount} PROS
                  </div>
                  <div>
                    <span className="font-medium">作成日:</span> {formatDate(proposal.created_at)}
                  </div>
                  <div>
                    <span className="font-medium">現在の支持率:</span> {Math.round(proposal.support_rate * 100)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {proposal.status === "Active" && !hasVoted && (
            <Card>
              <CardHeader>
                <CardTitle>投票する</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVote} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-4">
                      賛成度を選択してください (0: 完全反対 ～ 100: 完全賛成)
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={supportLevel}
                        onChange={(e) => setSupportLevel(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>完全反対</span>
                        <span className="font-medium text-lg">{supportLevel}%</span>
                        <span>完全賛成</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium mb-2">
                      コメント（任意）
                    </label>
                    <textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="投票理由やご意見をお聞かせください..."
                      maxLength={500}
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      {comment.length}/500文字
                    </div>
                  </div>

                  <div className="bg-accent/50 p-4 rounded-md">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Vote size={16} />
                      投票について
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 投票には固定料金（数セント相当）がかかります</li>
                      <li>• 一度投票すると変更できません</li>
                      <li>• 多数派に投票した場合、少数派の担保を受け取れます</li>
                      <li>• KYC認証済みのユーザーのみ投票可能です</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isVoting}
                  >
                    {isVoting ? "投票中..." : "投票する"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {hasVoted && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-green-600 flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  投票が完了しました！投票期間終了後に結果をご確認ください。
                </div>
              </CardContent>
            </Card>
          )}

          {proposal.status !== "Active" && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  この提案は現在投票できません（ステータス: {proposal.status}）
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}