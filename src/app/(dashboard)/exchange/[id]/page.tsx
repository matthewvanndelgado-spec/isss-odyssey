"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { format, differenceInDays } from "date-fns";
import {
  ArrowLeft,
  Globe,
  GraduationCap,
  Palette,
  Plane,
  Calendar,
  ExternalLink,
  Users,
  CheckCircle2,
  Clock,
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";

const programTypeConfig: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ACADEMIC: {
    label: "Academic Exchange",
    color: "bg-blue-100 text-blue-700",
    icon: GraduationCap,
  },
  CULTURAL: {
    label: "Cultural Exchange",
    color: "bg-purple-100 text-purple-700",
    icon: Palette,
  },
  MOBILITY: {
    label: "Student Mobility",
    color: "bg-green-100 text-green-700",
    icon: Plane,
  },
};

export default function ExchangeProgramDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const id = params.id as string;
  const utils = trpc.useUtils();

  const { data: program, isLoading } = trpc.exchange.getById.useQuery(
    { id },
    { enabled: !!id && !!session }
  );

  const applyMutation = trpc.exchange.apply.useMutation({
    onSuccess: () => {
      utils.exchange.getById.invalidate({ id });
      utils.exchange.getMyApplications.invalidate();
    },
  });

  const handleApply = () => {
    applyMutation.mutate({ programId: id });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/exchange">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Programs
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Program not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typeInfo = programTypeConfig[program.type] ?? programTypeConfig.ACADEMIC;
  const TypeIcon = typeInfo.icon;
  const daysUntilDeadline = program.deadline
    ? differenceInDays(new Date(program.deadline), new Date())
    : null;
  const isDeadlinePassed = daysUntilDeadline !== null && daysUntilDeadline < 0;
  const isStudent = session?.user?.role === "STUDENT";

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/exchange">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Programs
        </Link>
      </Button>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-8">
        <div className="relative z-10">
          <Badge className={`${typeInfo.color} mb-3`}>
            <TypeIcon className="h-3 w-3 mr-1" />
            {typeInfo.label}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{program.title}</h1>
          {program._count.applications > 0 && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="h-4 w-4" />
              {program._count.applications} applicant{program._count.applications !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About This Program</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{program.description}</p>
            </CardContent>
          </Card>

          {/* Eligibility */}
          {program.eligibility && (
            <Card>
              <CardHeader>
                <CardTitle>Eligibility Requirements</CardTitle>
                <CardDescription>
                  Review the requirements below to determine if you qualify
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {program.eligibility.split("\n").map((line, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <p className="text-sm">{line}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Dates */}
          {program.deadline && (
            <Card>
              <CardHeader>
                <CardTitle>Key Dates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Application Deadline</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(program.deadline), "MMMM d, yyyy")}
                      {!isDeadlinePassed && daysUntilDeadline !== null && (
                        <span className="ml-1 font-medium text-primary">
                          ({daysUntilDeadline} days remaining)
                        </span>
                      )}
                      {isDeadlinePassed && (
                        <span className="ml-1 font-medium text-red-600">
                          (Deadline has passed)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Facts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Facts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Type</p>
                <div className="flex items-center gap-2">
                  <TypeIcon className="h-4 w-4" />
                  <p className="text-sm font-medium">{typeInfo.label}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Deadline</p>
                <p className="text-sm font-medium">
                  {program.deadline
                    ? format(new Date(program.deadline), "MMMM d, yyyy")
                    : "Open enrollment"}
                </p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                <Badge
                  variant="secondary"
                  className={isDeadlinePassed ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}
                >
                  {isDeadlinePassed ? "Closed" : "Open"}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Applicants</p>
                <p className="text-sm font-medium">{program._count.applications}</p>
              </div>
            </CardContent>
          </Card>

          {/* Apply CTA */}
          {isStudent && (
            <Card>
              <CardContent className="pt-6">
                {program.hasApplied ? (
                  <div className="text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
                    <p className="text-sm font-medium">Application Submitted</p>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      <Clock className="h-3 w-3 mr-1" />
                      {program.applicationStatus?.replace(/_/g, " ") ?? "PENDING"}
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleApply}
                      disabled={isDeadlinePassed || applyMutation.isPending}
                    >
                      {applyMutation.isPending ? "Applying..." : "Apply Now"}
                    </Button>
                    {isDeadlinePassed && (
                      <p className="text-xs text-center text-red-600">
                        Applications are no longer being accepted
                      </p>
                    )}
                    {program.applicationUrl && !isDeadlinePassed && (
                      <Button variant="outline" className="w-full" asChild>
                        <a
                          href={program.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          External Application
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
