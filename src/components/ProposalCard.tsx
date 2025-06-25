// File: src/components/ProposalCard.tsx
import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Vote, Clock, CheckCircle, ThumbsUp, ThumbsDown, FileText, Calendar } from "lucide-react";

interface ProposalCardProps {
    proposal: {
        id: string;
        title: string;
        status: string;
        description: string;
        vote_count: number;
        support_count: number | null;
        oppose_count: number | null;
        final_result: string | null;
        voting_start_date?: string;
    };
}

export default function ProposalCard({ proposal }: ProposalCardProps) {
    const getStatusConfig = (status: string) => {
        switch (status) {
            case "Active":
                return {
                    color: "bg-tropical-teal/10 text-tropical-teal border border-tropical-teal/30",
                    icon: <Vote size={14} />
                };
            case "Pending":
                return {
                    color: "bg-tropical-sun/10 text-tropical-orange border border-tropical-sun/30",
                    icon: <Clock size={14} />
                };
            case "Finalized":
                return {
                    color: "bg-gray-100 text-gray-600 border border-gray-200",
                    icon: <CheckCircle size={14} />
                };
            default:
                return {
                    color: "bg-gray-100 text-gray-600 border border-gray-200",
                    icon: <FileText size={14} />
                };
        }
    };

    const statusConfig = getStatusConfig(proposal.status);
    const isVotingActive = proposal.status === "Active";
    const isFinalized = proposal.status === "Finalized";

    return (
        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/70 backdrop-blur-sm border border-tropical-sun/20 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium line-clamp-2 text-tropical-teal leading-snug">
                    {proposal.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
                <p className="text-sm text-tropical-teal/70 line-clamp-3 leading-relaxed font-light">
                    {proposal.description}
                </p>
                <div className="flex items-center justify-between">
                    <Badge className={statusConfig.color + " font-medium rounded-full px-3 py-1 flex items-center gap-1"}>
                        {statusConfig.icon}
                        {proposal.status}
                    </Badge>
                    <div className="text-sm text-tropical-teal/60 font-medium bg-tropical-sun/10 px-3 py-1 rounded-full flex items-center gap-1">
                        <Calendar size={12} />
                        {proposal.vote_count} votes
                    </div>
                </div>

                {/* Show results only for finalized proposals */}
                {isFinalized && proposal.support_count !== null && proposal.oppose_count !== null && (
                    <div className="text-sm space-y-2 bg-gray-50/80 rounded-xl p-3">
                        <div className="flex justify-between items-center">
                            <span className="text-tropical-teal/70 flex items-center gap-2">
                                <ThumbsUp size={14} className="text-tropical-green" /> Support:
                            </span>
                            <span className="font-semibold text-tropical-green">{proposal.support_count} votes</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-tropical-teal/70 flex items-center gap-2">
                                <ThumbsDown size={14} className="text-red-500" /> Oppose:
                            </span>
                            <span className="font-semibold text-red-500">{proposal.oppose_count} votes</span>
                        </div>
                        {proposal.final_result && (
                            <div className="text-center mt-3">
                                <Badge className={
                                    proposal.final_result === 'approved'
                                        ? 'bg-tropical-green/10 text-tropical-green border border-tropical-green/30 font-medium rounded-full px-4 py-1 flex items-center gap-1 w-fit mx-auto'
                                        : 'bg-red-50 text-red-600 border border-red-200 font-medium rounded-full px-4 py-1 flex items-center gap-1 w-fit mx-auto'
                                }>
                                    {proposal.final_result === 'approved' ? (
                                        <>
                                            <CheckCircle size={14} />
                                            Approved
                                        </>
                                    ) : (
                                        <>
                                            <FileText size={14} />
                                            Rejected
                                        </>
                                    )}
                                </Badge>
                            </div>
                        )}
                    </div>
                )}

                {/* For active/pending proposals, hide voting results */}
                {(isVotingActive || proposal.status === "Pending") && (
                    <div className="text-sm text-tropical-teal/60 bg-tropical-sun/5 rounded-xl p-3 text-center font-light flex items-center justify-center gap-2">
                        {isVotingActive ? (
                            <>
                                <Vote size={14} />
                                Voting Active
                            </>
                        ) : (
                            <>
                                <Clock size={14} />
                                Voting starts: {proposal.voting_start_date ? new Date(proposal.voting_start_date).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "--"}
                            </>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-0">
                <Link href={`/proposal/${proposal.id}`} className="w-full">
                    <Button
                        variant="outline"
                        className={
                            isVotingActive
                                ? "w-full gradient-tropical hover:gradient-sunset text-white border-0 font-medium rounded-xl transition-all duration-300 hover:scale-105 shadow-md flex items-center gap-2 justify-center"
                                : "w-full border-2 border-tropical-teal/30 text-tropical-teal hover:bg-tropical-teal hover:text-white font-medium rounded-xl transition-all duration-300 flex items-center gap-2 justify-center"
                        }
                    >
                        {isVotingActive ? (
                            <>
                                <Vote size={16} />
                                Vote Now
                            </>
                        ) : (
                            <>
                                <FileText size={16} />
                                View Details
                            </>
                        )}
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
