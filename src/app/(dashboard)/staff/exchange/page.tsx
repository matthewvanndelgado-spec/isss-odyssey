"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Globe,
  Archive,
  ArchiveRestore,
  Pencil,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";

const programTypeColors: Record<string, string> = {
  ACADEMIC: "bg-blue-100 text-blue-700",
  CULTURAL: "bg-purple-100 text-purple-700",
  MOBILITY: "bg-green-100 text-green-700",
};

export default function StaffExchangePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.exchange.getAll.useQuery({
    search: searchQuery || undefined,
    showArchived,
    limit: 50,
  });

  const archiveMutation = trpc.exchange.archive.useMutation({
    onSuccess: () => {
      utils.exchange.getAll.invalidate();
    },
  });

  const handleArchiveToggle = (id: string, isArchived: boolean) => {
    archiveMutation.mutate({ id, isArchived: !isArchived });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exchange Programs</h1>
          <p className="text-muted-foreground mt-1">
            Manage exchange programs and student applications
          </p>
        </div>
        <Button asChild>
          <Link href="/staff/exchange/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Program
          </Link>
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search exchange programs"
          />
        </div>
        <Button
          variant={showArchived ? "default" : "outline"}
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive className="h-4 w-4 mr-1" />
          {showArchived ? "Showing Archived" : "Show Archived"}
        </Button>
      </div>

      {/* Programs Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.programs && data.programs.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" role="table" aria-label="Exchange programs list">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Program</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Deadline</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Applications</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.programs.map((program) => (
                    <tr key={program.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{program.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {program.description}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={programTypeColors[program.type] ?? "bg-gray-100 text-gray-700"}>
                          {program.type}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">
                          {program.deadline
                            ? format(new Date(program.deadline), "MMM d, yyyy")
                            : "No deadline"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{program._count.applications}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className={program.isArchived ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"}>
                          {program.isArchived ? "Archived" : "Active"}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/staff/exchange/new?edit=${program.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchiveToggle(program.id, program.isArchived)}
                            disabled={archiveMutation.isPending}
                          >
                            {program.isArchived ? (
                              <ArchiveRestore className="h-4 w-4" />
                            ) : (
                              <Archive className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No programs found</p>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Create your first exchange program to get started"}
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link href="/staff/exchange/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Program
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
