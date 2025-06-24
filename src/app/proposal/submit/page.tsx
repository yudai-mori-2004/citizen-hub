"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { FileText } from "lucide-react";

export default function SubmitProposal() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [votingDuration, setVotingDuration] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          voting_duration_days: votingDuration,
        }),
      });

      if (response.ok) {
        alert("提案が正常に投稿されました！");
        setTitle("");
        setDescription("");
        setVotingDuration(7);
      } else {
        alert("エラーが発生しました。再度お試しください。");
      }
    } catch {
      alert("エラーが発生しました。再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">新しい提案を投稿</CardTitle>
            <CardDescription className="text-center">
              住民の皆様からの政策提案をお待ちしています。
              <br />
              提案には100 PROSトークンの担保が必要です。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  提案タイトル *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="例：公園に新しい遊具を設置する提案"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  提案内容 *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="提案の詳細な内容を記載してください..."
                  required
                  maxLength={1000}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {description.length}/1000文字
                </div>
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium mb-2">
                  投票期間
                </label>
                <select
                  id="duration"
                  value={votingDuration}
                  onChange={(e) => setVotingDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value={3}>3日間</option>
                  <option value={7}>7日間</option>
                  <option value={14}>14日間</option>
                  <option value={30}>30日間</option>
                </select>
              </div>

              <div className="bg-accent/50 p-4 rounded-md">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText size={16} />
                  提案投稿について
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 提案投稿には100 PROSトークンの担保が必要です</li>
                  <li>• スパムと判定された場合、担保は返却されません</li>
                  <li>• 有効な提案は翌日から投票が開始されます</li>
                  <li>• 投票期間終了後、結果に応じて配当が分配されます</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !title.trim() || !description.trim()}
              >
                {isSubmitting ? "投稿中..." : "提案を投稿する（100 PROS）"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}