"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import ProposalCard from "@/components/ProposalCard";
import LoadingSpinner from "@/components/LoadingSpinner";
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

function AllProposalsContent() {
  const searchParams = useSearchParams();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>(searchParams.get('filter') || "active"); // Default to active voting
  const [currentPage, setCurrentPage] = useState(1);
  const proposalsPerPage = 9;

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
    switch (filter) {
      case "upcoming":
        return proposal.status === "Pending";
      case "active":
        return proposal.status === "Active";
      case "approved":
        return proposal.status === "Finalized" && proposal.final_result === "approved";
      case "rejected":
        return proposal.status === "Finalized" && proposal.final_result === "rejected";
      default:
        return true;
    }
  });

  const getFilterCount = (filterType: string) => {
    switch (filterType) {
      case "upcoming":
        return proposals.filter(p => p.status === "Pending").length;
      case "active":
        return proposals.filter(p => p.status === "Active").length;
      case "approved":
        return proposals.filter(p => p.status === "Finalized" && p.final_result === "approved").length;
      case "rejected":
        return proposals.filter(p => p.status === "Finalized" && p.final_result === "rejected").length;
      default:
        return proposals.length;
    }
  };

  const getFilterLabel = (filterType: string) => {
    switch (filterType) {
      case "upcoming":
        return "Before Voting Period";
      case "active":
        return "During Voting Period";
      case "approved":
        return "Approved";
      case "rejected":
        return "Not Approved";
      default:
        return "All";
    }
  };

  if (loading) {
    return (
      <LoadingSpinner size="lg" text="Loading proposals..." fullScreen />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">All Proposals</h1>
        <p className="text-center text-muted-foreground">
          Browse and participate in community proposals
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {['upcoming', 'active', 'approved', 'rejected'].map((filterType) => (
          <Button
            key={filterType}
            variant={filter === filterType ? "default" : "outline"}
            onClick={() => {
              setFilter(filterType);
              setCurrentPage(1); // Reset page when filter changes
            }}
            className="flex items-center gap-2"
          >
            {getFilterLabel(filterType)}
            <Badge variant="secondary">{getFilterCount(filterType)}</Badge>
          </Button>
        ))}
      </div>

      {/* Proposals Grid */}
      {filteredProposals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-lg text-muted-foreground">
            No {getFilterLabel(filter).toLowerCase()} proposals found
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProposals
              .slice((currentPage - 1) * proposalsPerPage, currentPage * proposalsPerPage)
              .map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
          </div>

          {/* Pagination */}
          {filteredProposals.length > proposalsPerPage && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2"
              >
                Previous
              </Button>

              <div className="flex gap-2">
                {Array.from(
                  { length: Math.ceil(filteredProposals.length / proposalsPerPage) },
                  (_, i) => i + 1
                ).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className="w-10 h-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(Math.ceil(filteredProposals.length / proposalsPerPage), currentPage + 1))}
                disabled={currentPage === Math.ceil(filteredProposals.length / proposalsPerPage)}
                className="px-4 py-2"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Summary Stats */}
      <div className="mt-12 bg-accent/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-center">Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {proposals.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Proposals</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {getFilterCount("active")}
            </div>
            <div className="text-sm text-muted-foreground">Voting Now</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {getFilterCount("approved")}
            </div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {getFilterCount("rejected")}
            </div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AllProposalsPage() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner size="lg" text="Loading proposals..." fullScreen />}>
        <AllProposalsContent />
      </Suspense>
    </Layout>
  );
}
