"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Send,
  Loader2,
  User,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const categoryLabels: Record<string, string> = {
  VISA: "Visa & Immigration",
  ACADEMIC: "Academic",
  FINANCIAL: "Financial",
  HOUSING: "Housing",
  GENERAL: "General",
};

export default function InquiryDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [responseText, setResponseText] = useState("");
  const inquiryId = params.id as string;

  const isStaff = session?.user?.role === "STAFF";
  const utils = trpc.useUtils();

  const { data: inquiry, isLoading } = trpc.inquiry.getById.useQuery(
    { id: inquiryId },
    { enabled: !!inquiryId && !!session }
  );

  const respondMutation = trpc.inquiry.respond.useMutation({
    onSuccess: () => {
      setResponseText("");
      utils.inquiry.getById.invalidate({ id: inquiryId });
    },
  });

  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (responseText.trim().length < 10) return;
    respondMutation.mutate({
      inquiryId,
      responseText: responseText.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Inquiry not found</p>
            <Button asChild className="mt-4">
              <Link href="/inquiries">Back to Inquiries</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[inquiry.status] ?? statusConfig.PENDING;
  const StatusIcon = status.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link
            href={isStaff ? "/staff/inquiries" : "/inquiries"}
            aria-label="Back to inquiries"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{inquiry.subject}</h1>
          <p className="text-muted-foreground mt-1">
            Submitted by {inquiry.student.firstName} {inquiry.student.lastName}
          </p>
        </div>
        <Badge className={`${status.variant} hover:${status.variant}`}>
          <StatusIcon className="mr-1 h-3 w-3" />
          {status.label}
        </Badge>
      </div>

      {/* Inquiry Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Inquiry Details</CardTitle>
              <CardDescription>
                {categoryLabels[inquiry.category] ?? inquiry.category} -
                Created on {format(new Date(inquiry.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {inquiry.description}
          </p>
        </CardContent>
      </Card>

      {/* Conversation Thread */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Conversation</h2>

        {/* Original inquiry message */}
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {inquiry.student.firstName} {inquiry.student.lastName}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(inquiry.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm whitespace-pre-wrap">{inquiry.description}</p>
            </div>
          </div>
        </div>

        {/* Staff responses */}
        {inquiry.responses.map((response) => (
          <div key={response.id} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {response.staff.firstName} {response.staff.lastName}
                </span>
                <Badge variant="secondary" className="text-xs">
                  ISSO Staff
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(response.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                <p className="text-sm whitespace-pre-wrap">{response.responseText}</p>
              </div>
            </div>
          </div>
        ))}

        {inquiry.responses.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
            No responses yet. Our staff will respond as soon as possible.
          </div>
        )}
      </div>

      <Separator />

      {/* Staff Response Form */}
      {isStaff && inquiry.status !== "CLOSED" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submit Response</CardTitle>
            <CardDescription>
              Respond to this student inquiry. This will update the status to
              &ldquo;Responded&rdquo;.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitResponse} className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Type your response here..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  className="resize-none"
                  aria-label="Response text"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Min 10 characters</span>
                  <span>{responseText.length}/2000</span>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    respondMutation.isLoading || responseText.trim().length < 10
                  }
                >
                  {respondMutation.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Response
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
