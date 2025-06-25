"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Vote, Calendar, TrendingUp, User, CheckCircle, Clock, X, Coins } from "lucide-react";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";

interface UserProposal {
    id: string;
    title: string;
    description: string;
    status: "Pending" | "Active" | "Finalized";
    final_result: "approved" | "rejected" | null;
    created_at: string;
    voting_start_date: string | null;
    voting_end_date: string | null;
    vote_count: number;
    support_count: number | null;
    oppose_count: number | null;
    neutral_count: number | null;
    collateral_amount: number;
}

interface UserVote {
    id: string;
    proposal_id: string;
    support_level: number;
    comment: string | null;
    created_at: string;
    proposal_title: string;
    proposal_status: "Pending" | "Active" | "Finalized";
    final_result: "approved" | "rejected" | null;
    collateral_amount: number;
}

interface UserBalance {
    balance: number;
    transactions: any[];
    user_id: string;
}

function getStatusIcon(status: string, finalResult?: string | null) {
    if (status === "Active") {
        return <Clock className="w-4 h-4 text-blue-500" />;
    } else if (status === "Finalized") {
        return finalResult === "approved"
            ? <CheckCircle className="w-4 h-4 text-green-500" />
            : <X className="w-4 h-4 text-red-500" />;
    }
    return <Clock className="w-4 h-4 text-gray-500" />;
}

function getStatusBadge(status: string, finalResult?: string | null) {
    if (status === "Active") {
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Voting</Badge>;
    } else if (status === "Finalized") {
        return finalResult === "approved"
            ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>
            : <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
}

function getSupportDescription(level: number) {
    if (level > 50) return "Strong Support";
    if (level > 0) return "Support";
    if (level === 0) return "Neutral";
    if (level > -50) return "Oppose";
    return "Strong Oppose";
}

function getSupportColor(level: number) {
    if (level > 50) return "text-green-600 font-bold";
    if (level > 0) return "text-green-500";
    if (level === 0) return "text-gray-500";
    if (level > -50) return "text-red-500";
    return "text-red-600 font-bold";
}

export default function MyPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [proposals, setProposals] = useState<UserProposal[]>([]);
    const [votes, setVotes] = useState<UserVote[]>([]);
    const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "loading") return;
        if (!session) {
            router.push("/auth/signin");
            return;
        }

        fetchUserData();
    }, [session, status, router]);

    const fetchUserData = async () => {
        try {
            // Fetch user proposals
            const proposalsResponse = await fetch("/api/user/proposals");
            if (proposalsResponse.ok) {
                const proposalsData = await proposalsResponse.json();
                setProposals(proposalsData.proposals);
            }

            // Fetch user votes
            const votesResponse = await fetch("/api/user/votes");
            if (votesResponse.ok) {
                const votesData = await votesResponse.json();
                setVotes(votesData.votes);
            }

            // Fetch user balance
            const balanceResponse = await fetch("/api/user/balance");
            if (balanceResponse.ok) {
                const balanceData = await balanceResponse.json();
                setUserBalance(balanceData);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <Layout>
                <LoadingSpinner size="lg" text="Loading your data..." fullScreen />
            </Layout>
        );
    }

    if (!session) {
        return null;
    }

    const approvedProposals = proposals.filter(p => p.final_result === "approved").length;

    return (
        <Layout>
            <div className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <User className="w-8 h-8 text-tropical-teal" />
                        <h1 className="text-3xl font-bold text-tropical-teal">My Page</h1>
                    </div>
                    <p className="text-gray-600">
                        Welcome, {session.user?.name}\! Track your proposals and voting history.
                    </p>
                </div>

                {/* PROS Balance */}
                {userBalance && (
                    <Card className="mb-8 bg-blue-50 border-blue-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <Coins className="w-6 h-6 text-blue-600" />
                                <div>
                                    <p className="text-sm text-blue-600 font-medium">Current PROS Balance</p>
                                    <p className="text-2xl font-bold text-blue-800">{userBalance.balance} PROS</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-white/80 backdrop-blur-sm border-tropical-sun/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Submitted Proposals</p>
                                    <p className="text-2xl font-bold text-tropical-teal">{proposals.length}</p>
                                </div>
                                <FileText className="w-8 h-8 text-tropical-orange" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm border-tropical-sun/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Votes Cast</p>
                                    <p className="text-2xl font-bold text-tropical-teal">{votes.length}</p>
                                </div>
                                <Vote className="w-8 h-8 text-tropical-orange" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm border-tropical-sun/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Approved Proposals</p>
                                    <p className="text-2xl font-bold text-tropical-teal">{approvedProposals}</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-tropical-green" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="proposals" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 lg:w-400">
                        <TabsTrigger value="proposals" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Your Proposals
                        </TabsTrigger>
                        <TabsTrigger value="votes" className="flex items-center gap-2">
                            <Vote className="w-4 h-4" />
                            Voting History
                        </TabsTrigger>
                    </TabsList>

                    {/* My Proposals Tab */}
                    <TabsContent value="proposals" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-tropical-teal">Your Proposals</h2>
                            <Link href="/proposal/submit">
                                <Button className="gradient-tropical hover:gradient-sunset text-white">
                                    Submit New Proposal
                                </Button>
                            </Link>
                        </div>

                        {proposals.length === 0 ? (
                            <Card className="bg-white/80 backdrop-blur-sm border-tropical-sun/20">
                                <CardContent className="p-12 text-center">
                                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 mb-4">You haven't submitted any proposals yet</p>
                                    <Link href="/proposal/submit">
                                        <Button className="gradient-tropical hover:gradient-sunset text-white">
                                            Submit Your First Proposal
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {proposals.map((proposal) => (
                                    <Card key={proposal.id} className="bg-white/80 backdrop-blur-sm border-tropical-sun/20 hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg text-tropical-teal mb-2">
                                                        {proposal.title}
                                                    </CardTitle>
                                                    <CardDescription className="text-gray-600">
                                                        {proposal.description}
                                                    </CardDescription>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    {getStatusIcon(proposal.status, proposal.final_result)}
                                                    {getStatusBadge(proposal.status, proposal.final_result)}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                                                <span className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    Created: {new Date(proposal.created_at).toLocaleDateString("en-US")}
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    <Coins className="w-4 h-4" />
                                                    Collateral: {proposal.collateral_amount || 100} PROS
                                                </span>
                                                {proposal.status === "Active" && proposal.voting_end_date && (
                                                    <span className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        Ends: {new Date(proposal.voting_end_date).toLocaleDateString("en-US")}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm text-gray-600">
                                                    {proposal.status === "Finalized" ? (
                                                        <>Support: {proposal.support_count || 0} | Oppose: {proposal.oppose_count || 0} | Neutral: {proposal.neutral_count || 0}</>
                                                    ) : (
                                                        <>Total Votes: {proposal.vote_count}</>
                                                    )}
                                                </div>
                                                <Link href={`/proposal/${proposal.id}`}>
                                                    <Button variant="outline" size="sm" className="border-tropical-teal text-tropical-teal hover:bg-tropical-teal hover:text-white">
                                                        View Details
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* My Votes Tab */}
                    <TabsContent value="votes" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-tropical-teal">Voting History</h2>
                        </div>

                        {votes.length === 0 ? (
                            <Card className="bg-white/80 backdrop-blur-sm border-tropical-sun/20">
                                <CardContent className="p-12 text-center">
                                    <Vote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 mb-4">You haven't voted on any proposals yet</p>
                                    <Link href="/all">
                                        <Button className="gradient-tropical hover:gradient-sunset text-white">
                                            Browse Proposals
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {votes.map((vote) => (
                                    <Card key={vote.id} className="bg-white/80 backdrop-blur-sm border-tropical-sun/20 hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg text-tropical-teal mb-2">
                                                        {vote.proposal_title}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <div className="text-sm text-gray-600">
                                                            Support Level: <span className={`font-semibold ${getSupportColor(vote.support_level)}`}>
                                                                {vote.support_level > 0 ? '+' : ''}{vote.support_level} ({getSupportDescription(vote.support_level)})
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            Collateral: <span className="font-semibold text-tropical-orange">{vote.collateral_amount || 20} PROS</span>
                                                        </div>
                                                        {getStatusBadge(vote.proposal_status, vote.final_result)}
                                                    </div>
                                                    {vote.comment && (
                                                        <CardDescription className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                            &quot;{vote.comment}&quot;
                                                        </CardDescription>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-center text-sm text-gray-500">
                                                <span className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    Voted: {new Date(vote.created_at).toLocaleDateString("en-US")}
                                                </span>
                                                <Link href={`/proposal/${vote.proposal_id}`}>
                                                    <Button variant="outline" size="sm" className="border-tropical-teal text-tropical-teal hover:bg-tropical-teal hover:text-white">
                                                        View Proposal
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
}
