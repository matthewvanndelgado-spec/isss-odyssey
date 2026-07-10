"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Shield,
  FileText,
  CheckCircle2,
  XCircle,
  Save,
  User,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";
import {
  calculateDaysUntilExpiry,
  getVisaStatusTextColor,
  formatVisaType,
  VISA_TYPES,
} from "@/lib/visa-utils";
import Link from "next/link";

const VISA_STATUSES = ["VALID", "EXPIRING_SOON", "EXPIRED", "PENDING_RENEWAL"] as const;

export default function StaffVisaDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const utils = trpc.useUtils();

  const { data: visaRecord, isLoading } = trpc.visa.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  const [editStatus, setEditStatus] = useState<string>("");
  const [editVisaType, setEditVisaType] = useState<string>("");
  const [editExpiryDate, setEditExpiryDate] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  const updateMutation = trpc.visa.updateStatus.useMutation({
    onSuccess: () => {
      utils.visa.getById.invalidate({ id });
      utils.visa.getAll.invalidate();
      setIsEditing(false);
    },
  });

  const updateDocMutation = trpc.visa.updateDocumentStatus.useMutation({
    onSuccess: () => {
      utils.visa.getById.invalidate({ id });
    },
  });

  const startEditing = () => {
    if (visaRecord) {
      setEditStatus(visaRecord.status);
      setEditVisaType(visaRecord.visaType);
      setEditExpiryDate(format(new Date(visaRecord.expiryDate), "yyyy-MM-dd"));
      setEditNotes(visaRecord.notes ?? "");
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      id,
      status: editStatus as (typeof VISA_STATUSES)[number],
      visaType: editVisaType as (typeof VISA_TYPES)[number],
      expiryDate: editExpiryDate,
      notes: editNotes,
    });
  };

  const handleDocumentAction = (documentId: string, status: "APPROVED" | "REJECTED") => {
    updateDocMutation.mutate({ documentId, status });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!visaRecord) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/staff/visa">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Visa Management
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Visa record not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysLeft = calculateDaysUntilExpiry(visaRecord.expiryDate);
  const statusColor = getVisaStatusTextColor(visaRecord.status);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/staff/visa">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Visa Management
        </Link>
      </Button>

      {/* Student Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>
                  {visaRecord.student.firstName} {visaRecord.student.lastName}
                </CardTitle>
                <CardDescription>{visaRecord.student.email}</CardDescription>
              </div>
            </div>
            <Badge className={`${statusColor} text-sm px-3 py-1`}>
              {visaRecord.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Visa Record Details / Edit Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Visa Record
            </CardTitle>
            {!isEditing ? (
              <Button onClick={startEditing} variant="outline" size="sm">
                Edit Record
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visaType">Visa Type</Label>
                <Select value={editVisaType} onValueChange={setEditVisaType}>
                  <SelectTrigger id="visaType">
                    <SelectValue placeholder="Select visa type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VISA_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatVisaType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {VISA_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={editExpiryDate}
                  onChange={(e) => setEditExpiryDate(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about this visa record..."
                  rows={3}
                />
              </div>
            </div>
          ) : (
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
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Days Remaining</p>
                <p
                  className={`text-sm font-medium ${
                    daysLeft < 14 ? "text-red-600" : daysLeft <= 60 ? "text-yellow-600" : "text-green-600"
                  }`}
                >
                  {daysLeft > 0 ? `${daysLeft} days` : daysLeft === 0 ? "Expires today" : `Expired ${Math.abs(daysLeft)} days ago`}
                </p>
              </div>
              {visaRecord.notes && (
                <div className="space-y-1 sm:col-span-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Notes</p>
                  <p className="text-sm">{visaRecord.notes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submitted Documents
          </CardTitle>
          <CardDescription>
            Review and approve/reject student documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visaRecord.documents.length > 0 ? (
            <div className="space-y-3">
              {visaRecord.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.documentType} - Uploaded{" "}
                        {format(new Date(doc.uploadedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === "PENDING" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleDocumentAction(doc.id, "APPROVED")}
                          disabled={updateDocMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDocumentAction(doc.id, "REJECTED")}
                          disabled={updateDocMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Badge
                        className={
                          doc.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {doc.status === "APPROVED" ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {doc.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No documents submitted yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
