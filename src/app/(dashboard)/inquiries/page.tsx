"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  Plus,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";

const statusConfig: Record<
  string,
  { label: string; variant: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDING: { label: "Pending", variant: "bg-yellow-100 text-yellow-800", icon: Clock },
  IN_PROGRESS: { label: "In Progress", variant: "bg-blue-100 text-blue-800", icon: AlertCircle },
  RESPONDED: { label: "Responded", variant: "bg-green-100 text-green-800", icon: CheckCircle2 },
  CLOSED: { label: "Closed", variant: "bg-gray-100 text-gray-800", icon: XCircle },
};

const categoryConfig: Record<string, { label: string; color: string }> = {
  VISA: { label: "Visa", color: "bg-purple-100 text-purple-800" },
  ACADEMIC: { label: "Academic", color: "bg-blue-100 text-blue-800" },
  FINANCIAL: { label: "Financial", color: "bg-green-100 text-green-800" },
  HOUSING: { label: "Housing", color: "bg-orange-100 text-orange-800" },
  GENERAL: { label: "General", color: "bg-gray-100 text-gray-800" },
};

export default function InquiriesPage() {
  const { data: session } = useSession();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const isStaff = session?.user?.role === "STAFF";

  const { data, isLoading } = trpc.inquiry.getAll.useQuery(
    {
      status: statusFilter === "ALL" ? undefined : (statusFilter as "PENDING" | "IN_PROGRESS" | "RESPONDED" | "CLOSED"),
      search: searchQuery || undefined,
    },
    { enabled: !!session }
  );

  // Staff should redirect to staff view
  if (isStaff) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inquiries</h1>
            <p className="text-muted-foreground mt-1">
              Manage student inquiries and respond to requests
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Staff Inquiry Management</p>
            <p className="text-muted-foreground mb-4">
              View and respond to all student inquiries
            </p>
            <Button asChild>
              <Link href="/staff/inquiries">Go to Staff Inquiries</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Inquiries</h1>
          <p className="text-muted-foreground mt-1">
            Submit and track your inquiries to the ISSO office
          </p>
        </div>
        <Button asChild>
          <Link href="/inquiries/new">
            <Plus className="mr-2 h-4 w-4" />
            New Inquiry
          </Link>
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inquiries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search inquiries"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="RESPONDED">Responded</TabsTrigger>
            <TabsTrigger value="CLOSED">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Inquiry Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.inquiries && data.inquiries.length > 0 ? (
        <div className="space-y-4">
          {data.inquiries.map((inquiry) => {
            const status = statusConfig[inquiry.status] ?? statusConfig.PENDING;
            const category = categoryConfig[inquiry.category] ?? categoryConfig.GENERAL;
            const StatusIcon = status.icon;

            return (
              <Link key={inquiry.id} href={`/inquiries/${inquiry.id}`}>
                <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-1">
                          {inquiry.subject}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {inquiry.description}
                        </CardDescription>
                      </div>
                      <Badge className={`${status.variant} shrink-0 hover:${status.variant}`}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant="secondary" className={category.color}>
                        {category.label}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {inquiry._count.responses}{" "}
                        {inquiry._count.responses === 1 ? "response" : "responses"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(inquiry.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No inquiries found</p>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Submit your first inquiry to get started"}
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link href="/inquiries/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Inquiry
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
