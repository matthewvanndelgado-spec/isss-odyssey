"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Globe2,
  ShieldAlert,
  Heart,
  Building2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";

const CATEGORY_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  ACADEMIC: { label: "Academic", icon: GraduationCap, color: "text-blue-600" },
  CULTURAL: { label: "Cultural", icon: Globe2, color: "text-purple-600" },
  SAFETY_EMERGENCY: { label: "Safety & Emergency", icon: ShieldAlert, color: "text-red-600" },
  STUDENT_LIFE: { label: "Student Life", icon: Heart, color: "text-pink-600" },
  ABOUT_UB_ISSO: { label: "About UB/ISSO", icon: Building2, color: "text-amber-600" },
};

export default function OrientationContentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: content, isLoading } = trpc.orientation.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  // Get all content in the same category for prev/next navigation
  const { data: categoryContent } = trpc.orientation.getByCategory.useQuery(
    { category: content?.category as "ACADEMIC" | "CULTURAL" | "SAFETY_EMERGENCY" | "STUDENT_LIFE" | "ABOUT_UB_ISSO" },
    { enabled: !!content?.category }
  );

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Content not found</p>
            <p className="text-muted-foreground mb-4">
              The orientation content you are looking for does not exist.
            </p>
            <Button asChild>
              <Link href="/orientation">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orientation
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryMeta = CATEGORY_META[content.category] ?? {
    label: content.category,
    icon: BookOpen,
    color: "text-gray-600",
  };
  const CategoryIcon = categoryMeta.icon;

  // Find prev/next items
  const currentIndex = categoryContent?.findIndex((item) => item.id === id) ?? -1;
  const prevItem = currentIndex > 0 ? categoryContent?.[currentIndex - 1] : null;
  const nextItem = categoryContent && currentIndex < categoryContent.length - 1
    ? categoryContent[currentIndex + 1]
    : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/orientation" className="hover:text-foreground transition-colors">
          Orientation
        </Link>
        <span>/</span>
        <Link
          href={`/orientation?category=${content.category}`}
          className="hover:text-foreground transition-colors"
        >
          {categoryMeta.label}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {content.title}
        </span>
      </nav>

      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Content Card */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1.5">
              <CategoryIcon className={`h-3.5 w-3.5 ${categoryMeta.color}`} />
              {categoryMeta.label}
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Last updated: {format(new Date(content.updatedAt), "MMMM d, yyyy")}
            </div>
          </div>
          <CardTitle className="text-2xl lg:text-3xl">{content.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Render content with basic markdown-like formatting */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {content.content.split("\n").map((paragraph, index) => {
              // Headers
              if (paragraph.startsWith("### ")) {
                return (
                  <h3 key={index} className="text-lg font-semibold mt-6 mb-3">
                    {paragraph.replace("### ", "")}
                  </h3>
                );
              }
              if (paragraph.startsWith("## ")) {
                return (
                  <h2 key={index} className="text-xl font-semibold mt-6 mb-3">
                    {paragraph.replace("## ", "")}
                  </h2>
                );
              }
              // Bullet points
              if (paragraph.startsWith("- ") || paragraph.startsWith("* ")) {
                return (
                  <li key={index} className="ml-4 text-sm leading-relaxed text-muted-foreground list-disc">
                    {paragraph.replace(/^[-*]\s/, "")}
                  </li>
                );
              }
              // Numbered lists
              if (/^\d+\.\s/.test(paragraph)) {
                return (
                  <li key={index} className="ml-4 text-sm leading-relaxed text-muted-foreground list-decimal">
                    {paragraph.replace(/^\d+\.\s/, "")}
                  </li>
                );
              }
              // Empty lines
              if (paragraph.trim() === "") {
                return <br key={index} />;
              }
              // Regular paragraphs with bold support
              return (
                <p key={index} className="text-sm leading-relaxed text-muted-foreground mb-3">
                  {paragraph.split(/\*\*(.*?)\*\*/).map((part, i) =>
                    i % 2 === 1 ? (
                      <strong key={i} className="font-semibold text-foreground">
                        {part}
                      </strong>
                    ) : (
                      part
                    )
                  )}
                </p>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Previous/Next Navigation */}
      {(prevItem || nextItem) && (
        <>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            {prevItem ? (
              <Button
                variant="outline"
                className="gap-2 max-w-[45%]"
                onClick={() => router.push(`/orientation/${prevItem.id}`)}
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">{prevItem.title}</span>
              </Button>
            ) : (
              <div />
            )}
            {nextItem ? (
              <Button
                variant="outline"
                className="gap-2 max-w-[45%]"
                onClick={() => router.push(`/orientation/${nextItem.id}`)}
              >
                <span className="truncate">{nextItem.title}</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Button>
            ) : (
              <div />
            )}
          </div>
        </>
      )}
    </div>
  );
}
