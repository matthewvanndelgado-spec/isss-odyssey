"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format, differenceInDays } from "date-fns";
import {
  Search,
  Globe,
  GraduationCap,
  Palette,
  Plane,
  Calendar,
  ArrowRight,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";

const programTypeConfig: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ACADEMIC: {
    label: "Academic",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: GraduationCap,
  },
  CULTURAL: {
    label: "Cultural",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Palette,
  },
  MOBILITY: {
    label: "Mobility",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: Plane,
  },
};

const TYPE_OPTIONS = [
  { value: "ALL", label: "All Programs" },
  { value: "ACADEMIC", label: "Academic" },
  { value: "CULTURAL", label: "Cultural" },
  { value: "MOBILITY", label: "Mobility" },
];

export default function ExchangeProgramsPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const isStaff = session?.user?.role === "STAFF";

  const { data, isLoading } = trpc.exchange.getAll.useQuery(
    {
      type: typeFilter === "ALL" ? undefined : (typeFilter as "ACADEMIC" | "CULTURAL" | "MOBILITY"),
      search: searchQuery || undefined,
    },
    { enabled: !!session }
  );

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium text-primary">ISSS Programs</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Explore Global Opportunities
          </h1>
          <p className="text-muted-foreground max-w-lg">
            Discover exchange programs, academic partnerships, and cultural immersion
            experiences available to University of Batangas students.
          </p>
          {isStaff && (
            <Button asChild className="mt-4">
              <Link href="/staff/exchange">Manage Programs</Link>
            </Button>
          )}
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
          <Globe className="h-full w-full" />
        </div>
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
        <div className="flex gap-2 flex-wrap">
          {TYPE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={typeFilter === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Programs Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-20 mb-2" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.programs && data.programs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.programs.map((program) => {
            const typeInfo = programTypeConfig[program.type] ?? programTypeConfig.ACADEMIC;
            const TypeIcon = typeInfo.icon;
            const daysUntilDeadline = program.deadline
              ? differenceInDays(new Date(program.deadline), new Date())
              : null;
            const isDeadlinePassed = daysUntilDeadline !== null && daysUntilDeadline < 0;

            return (
              <Link key={program.id} href={`/exchange/${program.id}`}>
                <Card className="h-full hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group border-transparent hover:border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={`${typeInfo.color} border`}>
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {typeInfo.label}
                      </Badge>
                      {program._count.applications > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {program._count.applications}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                      {program.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {program.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {program.eligibility && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        <span className="font-medium">Eligibility:</span>{" "}
                        {program.eligibility}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 flex items-center justify-between">
                    {program.deadline ? (
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span
                          className={
                            isDeadlinePassed
                              ? "text-red-600"
                              : daysUntilDeadline !== null && daysUntilDeadline <= 14
                                ? "text-yellow-600 font-medium"
                                : "text-muted-foreground"
                          }
                        >
                          {isDeadlinePassed
                            ? "Deadline passed"
                            : `Due ${format(new Date(program.deadline), "MMM d, yyyy")}`}
                          {!isDeadlinePassed && daysUntilDeadline !== null && (
                            <span className="ml-1">({daysUntilDeadline}d left)</span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Open enrollment</span>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No programs found</p>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search or filter criteria"
                : "No exchange programs are currently available"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
