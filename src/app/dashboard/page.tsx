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
  Minus,
  AlertCircle
} from "lucide-react";
import PROSBalance from "@/components/PROSBalance";
import { useWallet } from "@/hooks/useWallet";

interface UserBalance {
  balance: number;
  activities: UserActivity[];
  statistics: UserStatistics;
  user_id: string;
  transactions: UserActivity[]; // For backward compatibility
}

interface UserActivity {
  id: string;
  type: 'proposal' | 'vote';
  title: string;
  amount: number;
  status: string;
  created_at: string;
  tx_signature?: string;
  support_level?: number;
}

interface UserStatistics {
  totalProposals: number;
  totalVotes: number;
  totalStaked: number;
  approvedProposals: number;
  rejectedProposals: number;
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

  const getActivityIcon = (activity: UserActivity) => {
    if (activity.type === 'proposal') {
      return <FileText className="w-4 h-4 text-blue-500" />;
    } else {
      // Vote - different icons based on support level
      if (activity.support_level !== undefined) {
        if (activity.support_level > 50) {
          return <TrendingUp className="w-4 h-4 text-green-500" />;
        } else if (activity.support_level < 50) {
          return <TrendingDown className="w-4 h-4 text-red-500" />;
        } else {
          return <Minus className="w-4 h-4 text-gray-500" />;
        }
      }
      return <Vote className="w-4 h-4 text-purple-500" />;
    }
  };

  const getActivityColor = (activity: UserActivity) => {
    if (activity.type === 'proposal') {
      switch (activity.status) {
        case 'Approved':
          return "text-green-600";
        case 'Rejected':
          return "text-red-600";
        case 'Active':
          return "text-blue-600";
        default:
          return "text-orange-600";
      }
    } else {
      // Vote colors based on support level
      if (activity.support_level !== undefined) {
        if (activity.support_level > 50) {
          return "text-green-600";
        } else if (activity.support_level < 50) {
          return "text-red-600";
        } else {
          return "text-gray-600";
        }
      }
      return "text-purple-600";
    }
  };

  const getActivityDescription = (activity: UserActivity) => {
    if (activity.type === 'proposal') {
      return `Proposed - ${activity.status}`;
    } else {
      const supportText = activity.support_level !== undefined
        ? `${activity.support_level}% support`
        : 'Vote cast';
      return `${supportText} - ${activity.status}`;
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
    if (!userBalance?.statistics) return {
      totalProposals: 0,
      totalVotes: 0,
      totalStaked: 0,
      successfulProposals: 0,
      currentlyStaked: 0
    };

    const stats = userBalance.statistics;

    // Calculate currently staked (assuming ongoing proposals/votes still have stake locked)
    const currentlyStaked = userBalance.activities
      ?.filter(a => a.status === 'Active' || a.status === 'Pending')
      .reduce((sum, a) => sum + a.amount, 0) || 0;

    return {
      totalProposals: stats.totalProposals,
      totalVotes: stats.totalVotes,
      totalStaked: stats.totalStaked,
      successfulProposals: stats.approvedProposals,
      currentlyStaked
    };
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Proposals Submitted</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {stats.totalProposals}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Votes Cast</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {stats.totalVotes}
                    </p>
                  </div>
                  <Vote className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Successful Proposals</p>
                    <p className="text-2xl font-bold text-green-800">
                      {stats.successfulProposals}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Total Staked</p>
                    <p className="text-2xl font-bold text-orange-800">
                      {stats.totalStaked} PROS
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userBalance?.activities?.length ? (
                <div className="space-y-3">
                  {userBalance.activities.slice(0, 10).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getActivityIcon(activity)}
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            {getActivityDescription(activity)}
                          </p>
                          {activity.tx_signature && (
                            <p className="text-xs text-blue-600 font-mono">
                              {activity.tx_signature.substring(0, 20)}...
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${getActivityColor(activity)}`}>
                          {activity.amount} PROS
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(activity.created_at)}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs mt-1 ${activity.type === 'proposal' ? 'bg-blue-50' : 'bg-purple-50'
                            }`}
                        >
                          {activity.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No activities yet</p>
                  <p className="text-sm">Start by submitting a proposal or voting!</p>
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
