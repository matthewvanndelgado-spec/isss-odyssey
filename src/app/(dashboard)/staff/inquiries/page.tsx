"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Eye,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function StaffInquiriesPage() {
  const { data: session } = useSession();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.inquiry.getAll.useQuery(
    {
      status: statusFilter === "ALL" ? undefined : (statusFilter as "PENDING" | "IN_PROGRESS" | "RESPONDED" | "CLOSED"),
      search: searchQuery || undefined,
    },
    { enabled: !!session }
  );

  const updateStatusMutation = trpc.inquiry.updateStatus.useMutation({
    onSuccess: () => {
      utils.inquiry.getAll.invalidate();
    },
  });

  const filteredInquiries = data?.inquiries.filter((inquiry) => {
    if (categoryFilter !== "ALL" && inquiry.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  if (session?.user?.role !== "STAFF") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Access Denied</p>
          <p className="text-muted-foreground">
            This page is only accessible to ISSO staff.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inquiry Management</h1>
        <p className="text-muted-foreground mt-1">
          View and respond to all student inquiries
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by subject or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search inquiries"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]" aria-label="Filter by category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="VISA">Visa</SelectItem>
              <SelectItem value="ACADEMIC">Academic</SelectItem>
              <SelectItem value="FINANCIAL">Financial</SelectItem>
              <SelectItem value="HOUSING">Housing</SelectItem>
              <SelectItem value="GENERAL">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
            <TabsTrigger value="RESPONDED">Responded</TabsTrigger>
            <TabsTrigger value="CLOSED">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Statistics */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-yellow-600">
                {data.inquiries.filter((i) => i.status === "PENDING").length}
              </div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-blue-600">
                {data.inquiries.filter((i) => i.status === "IN_PROGRESS").length}
              </div>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-green-600">
                {data.inquiries.filter((i) => i.status === "RESPONDED").length}
              </div>
              <p className="text-xs text-muted-foreground">Responded</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-gray-600">
                {data.inquiries.filter((i) => i.status === "CLOSED").length}
              </div>
              <p className="text-xs text-muted-foreground">Closed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inquiry List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : filteredInquiries && filteredInquiries.length > 0 ? (
        <div className="space-y-3">
          {filteredInquiries.map((inquiry) => {
            const status = statusConfig[inquiry.status] ?? statusConfig.PENDING;
            const category = categoryConfig[inquiry.category] ?? categoryConfig.GENERAL;
            const StatusIcon = status.icon;

            return (
              <Card
                key={inquiry.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base line-clamp-1">
                          {inquiry.subject}
                        </CardTitle>
                      </div>
                      <CardDescription className="line-clamp-1">
                        From: {inquiry.student.firstName} {inquiry.student.lastName} ({inquiry.student.email})
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${category.color} shrink-0`}>
                        {category.label}
                      </Badge>
                      <Badge className={`${status.variant} shrink-0 hover:${status.variant}`}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {inquiry._count.responses} responses
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(inquiry.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {inquiry.status === "PENDING" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: inquiry.id,
                              status: "IN_PROGRESS",
                            })
                          }
                          disabled={updateStatusMutation.isLoading}
                        >
                          Mark In Progress
                        </Button>
                      )}
                      {inquiry.status === "RESPONDED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: inquiry.id,
                              status: "CLOSED",
                            })
                          }
                          disabled={updateStatusMutation.isLoading}
                        >
                          Close
                        </Button>
                      )}
                      <Button variant="default" size="sm" asChild>
                        <Link href={`/inquiries/${inquiry.id}`}>
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No inquiries found</p>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search terms"
                : "No student inquiries at this time"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
