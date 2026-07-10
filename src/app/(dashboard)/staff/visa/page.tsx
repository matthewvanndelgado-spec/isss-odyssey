"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Search,
  Shield,
  AlertTriangle,
  Eye,
  FileText,
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
import {
  calculateDaysUntilExpiry,
  getVisaStatusTextColor,
  formatVisaType,
} from "@/lib/visa-utils";

const VISA_STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "VALID", label: "Valid" },
  { value: "EXPIRING_SOON", label: "Expiring Soon" },
  { value: "EXPIRED", label: "Expired" },
  { value: "PENDING_RENEWAL", label: "Pending Renewal" },
];

export default function StaffVisaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data, isLoading } = trpc.visa.getAll.useQuery({
    status: statusFilter === "ALL" ? undefined : (statusFilter as "VALID" | "EXPIRING_SOON" | "EXPIRED" | "PENDING_RENEWAL"),
    search: searchQuery || undefined,
    limit: 50,
  });

  const { data: expiringData } = trpc.visa.getExpiringVisas.useQuery({
    withinDays: 30,
  });

  const expiringCount = expiringData?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visa Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage student visa records
          </p>
        </div>
        {expiringCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              {expiringCount} visa{expiringCount !== 1 ? "s" : ""} expiring within 30 days
            </span>
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search visa records"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {VISA_STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={statusFilter === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Visa Records Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32 mt-2" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.records && data.records.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" role="table" aria-label="Student visa records">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Student</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Visa Type</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Expiry Date</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Days Left</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Documents</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((record) => {
                    const daysLeft = calculateDaysUntilExpiry(record.expiryDate);
                    const statusColorClass = getVisaStatusTextColor(record.status);

                    return (
                      <tr key={record.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="text-sm font-medium">
                              {record.student.firstName} {record.student.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{record.student.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{formatVisaType(record.visaType)}</span>
                        </td>
                        <td className="p-4">
                          <Badge className={`${statusColorClass} text-xs`}>
                            {record.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">
                            {format(new Date(record.expiryDate), "MMM d, yyyy")}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-sm font-medium ${
                              daysLeft < 14
                                ? "text-red-600"
                                : daysLeft <= 60
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }`}
                          >
                            {daysLeft > 0 ? `${daysLeft} days` : daysLeft === 0 ? "Today" : "Expired"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{record._count.documents}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/staff/visa/${record.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No visa records found</p>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search terms"
                : "No student visa records in the system yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
