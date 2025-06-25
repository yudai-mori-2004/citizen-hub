"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  Vote,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  Minus,
  AlertCircle
} from "lucide-react";
import PROSBalance from "@/components/PROSBalance";
import { useWallet } from "@/hooks/useWallet";

interface UserBalance {
  balance: number;
  transactions: CollateralTransaction[];
  user_id: string;
}

interface CollateralTransaction {
  id: string;
  user_id: string;
  proposal_id: string | null;
  vote_id: string | null;
  transaction_type: "lock" | "return" | "forfeit" | "profit";
  amount: number;
  description: string | null;
  created_at: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const { connected } = useWallet();
  const router = useRouter();
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    fetchDashboardData();
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      const balanceResponse = await fetch("/api/user/balance");
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setUserBalance(balanceData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "lock":
        return <Minus className="w-4 h-4 text-orange-500" />;
      case "return":
        return <ArrowUpCircle className="w-4 h-4 text-green-500" />;
      case "forfeit":
        return <ArrowDownCircle className="w-4 h-4 text-red-500" />;
      case "profit":
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "lock":
        return "text-orange-600";
      case "return":
        return "text-green-600";
      case "forfeit":
        return "text-red-600";
      case "profit":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateStats = () => {
    if (!userBalance) return { totalLocked: 0, totalEarned: 0, totalLost: 0 };

    const totalLocked = userBalance.transactions
      .filter(t => t.transaction_type === "lock")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalEarned = userBalance.transactions
      .filter(t => t.transaction_type === "profit" || t.transaction_type === "return")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalLost = userBalance.transactions
      .filter(t => t.transaction_type === "forfeit")
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalLocked, totalEarned, totalLost };
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return null;
  }

  const stats = calculateStats();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            <Badge variant="outline" className="text-lg px-3 py-1">
              Welcome, {session.user?.name}
            </Badge>
          </div>

          {/* PROS Balance Overview */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Coins className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium mb-1">PROS Token Balance</p>
                    <div className="flex items-center gap-3">
                      <PROSBalance className="text-3xl font-bold" showIcon={false} />
                      {!connected && (
                        <div className="flex items-center gap-1 text-orange-600 text-sm">
                          <AlertCircle size={16} />
                          <span>Wallet not connected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Earned</p>
                    <p className="text-2xl font-bold text-green-800">
                      +{stats.totalEarned} PROS
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 font-medium">Total Lost</p>
                    <p className="text-2xl font-bold text-red-800">
                      -{stats.totalLost} PROS
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Currently Locked</p>
                    <p className="text-2xl font-bold text-orange-800">
                      {Math.max(0, stats.totalLocked - stats.totalEarned - stats.totalLost)} PROS
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userBalance?.transactions.length ? (
                <div className="space-y-3">
                  {userBalance.transactions.slice(0, 10).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <p className="font-medium capitalize">
                            {transaction.transaction_type}
                          </p>
                          <p className="text-sm text-gray-600">
                            {transaction.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                          {transaction.transaction_type === "lock" || transaction.transaction_type === "forfeit"
                            ? "-" : "+"}
                          {transaction.amount} PROS
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Start by submitting a proposal or voting\!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/proposal/submit")}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Submit New Proposal</h3>
                    <p className="text-sm text-gray-600">
                      Create a new proposal with 100 PROS collateral
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/")}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Vote className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Browse Proposals</h3>
                    <p className="text-sm text-gray-600">
                      Find active proposals to vote on
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
