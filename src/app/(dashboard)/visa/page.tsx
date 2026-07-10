"use client";

import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  Shield,
  FileText,
  Upload,
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Info,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/client";
import {
  calculateDaysUntilExpiry,
  formatVisaProgress,
  getVisaProgressColor,
  getVisaStatusTextColor,
  getRequiredDocuments,
  getVisaReminders,
  formatVisaType,
} from "@/lib/visa-utils";
import Link from "next/link";

const documentStatusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
};

const documentStatusColors: Record<string, string> = {
  PENDING: "text-yellow-600",
  APPROVED: "text-green-600",
  REJECTED: "text-red-600",
};

export default function VisaPage() {
  const { data: session } = useSession();
  const isStaff = session?.user?.role === "STAFF";

  const { data: visaRecord, isLoading } = trpc.visa.getMyVisa.useQuery(undefined, {
    enabled: !!session && !isStaff,
  });

  if (isStaff) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visa Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Manage student visa records and documents
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Staff Visa Management</p>
            <p className="text-muted-foreground mb-4">
              View and manage all student visa records
            </p>
            <Button asChild>
              <Link href="/staff/visa">Go to Staff Visa Management</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!visaRecord) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visa Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your visa status and required documents
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No Visa Record Found</p>
            <p className="text-muted-foreground text-center max-w-md">
              Your visa record has not been set up yet. Please contact the ISSO office
              to have your visa information added to the system.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysUntilExpiry = calculateDaysUntilExpiry(visaRecord.expiryDate);
  const progressPercent = formatVisaProgress(visaRecord.expiryDate);
  const progressColor = getVisaProgressColor(visaRecord.expiryDate);
  const statusColor = getVisaStatusTextColor(visaRecord.status);
  const reminders = getVisaReminders(visaRecord.expiryDate);
  const requiredDocs = getRequiredDocuments(visaRecord.visaType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visa Tracking</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your visa status and required documents
        </p>
      </div>

      {/* Reminders Section */}
      {reminders.length > 0 && (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div
              key={reminder.days}
              className={`flex items-start gap-3 rounded-lg border p-4 transition-all ${
                reminder.level === "danger"
                  ? "border-red-200 bg-red-50 text-red-900"
                  : reminder.level === "warning"
                    ? "border-yellow-200 bg-yellow-50 text-yellow-900"
                    : "border-blue-200 bg-blue-50 text-blue-900"
              }`}
              role="alert"
              aria-label={`Visa ${reminder.level} reminder`}
            >
              {reminder.level === "danger" ? (
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              ) : reminder.level === "warning" ? (
                <Bell className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <Info className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <p className="text-sm font-medium">{reminder.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Visa Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Current Visa Status
              </CardTitle>
              <CardDescription className="mt-1">
                {formatVisaType(visaRecord.visaType)}
              </CardDescription>
            </div>
            <Badge className={`${statusColor} text-sm px-3 py-1`}>
              {visaRecord.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Time Remaining</span>
              <span className="font-medium">
                {daysUntilExpiry > 0
                  ? `${daysUntilExpiry} days until expiry`
                  : daysUntilExpiry === 0
                    ? "Expires today"
                    : `Expired ${Math.abs(daysUntilExpiry)} days ago`}
              </span>
            </div>
            <div
              className="h-4 w-full rounded-full bg-gray-100 overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Visa validity progress"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Expired</span>
              <span>Valid</span>
            </div>
          </div>

          <Separator />

          {/* Visa Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Visa Type</p>
              <p className="text-sm font-medium">{formatVisaType(visaRecord.visaType)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Expiry Date</p>
              <p className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(visaRecord.expiryDate), "MMMM d, yyyy")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Updated</p>
              <p className="text-sm font-medium">
                {format(new Date(visaRecord.updatedAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          {visaRecord.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Notes</p>
                <p className="text-sm">{visaRecord.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Document Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Required Documents Checklist
          </CardTitle>
          <CardDescription>
            Documents required for your {formatVisaType(visaRecord.visaType).toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requiredDocs.map((docType) => {
              const submittedDoc = visaRecord.documents.find(
                (d) => d.documentType === docType
              );
              const status = submittedDoc?.status ?? "NOT_SUBMITTED";
              const StatusIcon = submittedDoc
                ? documentStatusIcons[submittedDoc.status] ?? Clock
                : FileText;
              const statusColorClass = submittedDoc
                ? documentStatusColors[submittedDoc.status] ?? "text-gray-400"
                : "text-gray-400";

              return (
                <div
                  key={docType}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-5 w-5 ${statusColorClass}`} />
                    <div>
                      <p className="text-sm font-medium">{docType}</p>
                      {submittedDoc && (
                        <p className="text-xs text-muted-foreground">
                          {submittedDoc.fileName} - Uploaded{" "}
                          {format(new Date(submittedDoc.uploadedAt), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                    }
                  >
                    {status === "NOT_SUBMITTED" ? "Not Submitted" : status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Upload required documents for your visa application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Drag and drop files here</p>
            <p className="text-xs text-muted-foreground mb-4">
              PDF, JPG, or PNG files up to 10MB
            </p>
            <Button variant="outline" size="sm">
              Browse Files
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Uploaded documents will be reviewed by ISSO staff. You will receive a notification
            once your documents are approved or if additional information is needed.
          </p>
        </CardContent>
      </Card>

      {/* Uploaded Documents History */}
      {visaRecord.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Document History</CardTitle>
            <CardDescription>
              All documents you have submitted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visaRecord.documents.map((doc) => {
                const StatusIcon = documentStatusIcons[doc.status] ?? Clock;
                const statusColorClass = documentStatusColors[doc.status] ?? "text-gray-400";

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.documentType} - {format(new Date(doc.uploadedAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${statusColorClass}`} />
                      <span className={`text-xs font-medium ${statusColorClass}`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
