"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  GraduationCap,
  Globe2,
  ShieldAlert,
  Heart,
  Building2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";

const CATEGORIES = [
  { id: "ACADEMIC", label: "Academic", icon: GraduationCap, color: "bg-blue-100 text-blue-700" },
  { id: "CULTURAL", label: "Cultural", icon: Globe2, color: "bg-purple-100 text-purple-700" },
  { id: "SAFETY_EMERGENCY", label: "Safety & Emergency", icon: ShieldAlert, color: "bg-red-100 text-red-700" },
  { id: "STUDENT_LIFE", label: "Student Life", icon: Heart, color: "bg-pink-100 text-pink-700" },
  { id: "ABOUT_UB_ISSO", label: "About UB/ISSO", icon: Building2, color: "bg-amber-100 text-amber-700" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

export default function StaffOrientationPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("ACADEMIC");
  const utils = trpc.useUtils();

  const { data: content, isLoading } = trpc.orientation.getAllForStaff.useQuery({
    category: activeCategory,
  });

  const deleteMutation = trpc.orientation.delete.useMutation({
    onSuccess: () => {
      utils.orientation.getAllForStaff.invalidate();
    },
  });

  const updateMutation = trpc.orientation.update.useMutation({
    onSuccess: () => {
      utils.orientation.getAllForStaff.invalidate();
    },
  });

  const reorderMutation = trpc.orientation.reorder.useMutation({
    onSuccess: () => {
      utils.orientation.getAllForStaff.invalidate();
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this content?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleTogglePublish = (id: string, isPublished: boolean) => {
    updateMutation.mutate({ id, isPublished: !isPublished });
  };

  const handleMoveUp = (index: number) => {
    if (!content || index === 0) return;
    const items = content.map((item, i) => ({
      id: item.id,
      order: i === index ? index - 1 : i === index - 1 ? index : i,
    }));
    reorderMutation.mutate({ items });
  };

  const handleMoveDown = (index: number) => {
    if (!content || index === content.length - 1) return;
    const items = content.map((item, i) => ({
      id: item.id,
      order: i === index ? index + 1 : i === index + 1 ? index : i,
    }));
    reorderMutation.mutate({ items });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orientation Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage orientation content for students
          </p>
        </div>
        <Button asChild>
          <Link href="/staff/orientation/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Content
          </Link>
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          return (
            <Button
              key={category.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              className="gap-2"
              role="tab"
              aria-selected={isActive}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </Button>
          );
        })}
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : content && content.length > 0 ? (
        <div className="space-y-3">
          {content.map((item, index) => {
            return (
              <Card key={item.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Order controls */}
                      <div className="flex flex-col gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0 || reorderMutation.isPending}
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === content.length - 1 || reorderMutation.isPending}
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Content info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          {!item.isPublished && (
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
                              Draft
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Updated {format(new Date(item.updatedAt), "MMM d, yyyy")} - Order: {item.order}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePublish(item.id, item.isPublished)}
                        disabled={updateMutation.isPending}
                        title={item.isPublished ? "Unpublish" : "Publish"}
                      >
                        {item.isPublished ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/staff/orientation/new?edit=${item.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                        className="hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
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
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No content in this category</p>
            <p className="text-muted-foreground mb-4">
              Create your first orientation content for this category
            </p>
            <Button asChild>
              <Link href={`/staff/orientation/new?category=${activeCategory}`}>
                <Plus className="h-4 w-4 mr-2" />
                Create Content
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
