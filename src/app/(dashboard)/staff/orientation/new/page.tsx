"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

const CATEGORIES = [
  { id: "ACADEMIC", label: "Academic" },
  { id: "CULTURAL", label: "Cultural" },
  { id: "SAFETY_EMERGENCY", label: "Safety & Emergency" },
  { id: "STUDENT_LIFE", label: "Student Life" },
  { id: "ABOUT_UB_ISSO", label: "About UB/ISSO" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

export default function NewOrientationContentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><p>Loading...</p></div>}>
      <NewOrientationContentInner />
    </Suspense>
  );
}

function NewOrientationContentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const defaultCategory = searchParams.get("category") as CategoryId | null;
  const isEdit = !!editId;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryId>(defaultCategory ?? "ACADEMIC");
  const [content, setContent] = useState("");
  const [order, setOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing content for editing
  const { data: existingContent } = trpc.orientation.getById.useQuery(
    { id: editId! },
    { enabled: !!editId }
  );

  useEffect(() => {
    if (existingContent) {
      setTitle(existingContent.title);
      setCategory(existingContent.category as CategoryId);
      setContent(existingContent.content);
      setOrder(existingContent.order);
      setIsPublished(existingContent.isPublished);
    }
  }, [existingContent]);

  const createMutation = trpc.orientation.create.useMutation({
    onSuccess: () => {
      router.push("/staff/orientation");
    },
  });

  const updateMutation = trpc.orientation.update.useMutation({
    onSuccess: () => {
      router.push("/staff/orientation");
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (title.length < 3) newErrors.title = "Title must be at least 3 characters";
    if (title.length > 200) newErrors.title = "Title must be less than 200 characters";
    if (content.length < 10) newErrors.content = "Content must be at least 10 characters";
    if (content.length > 10000) newErrors.content = "Content must be less than 10000 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit) {
      updateMutation.mutate({
        id: editId!,
        title,
        category,
        content,
        order,
        isPublished,
      });
    } else {
      createMutation.mutate({
        title,
        category,
        content,
        order,
        isPublished,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/staff/orientation">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? "Edit Content" : "Create Content"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isEdit
              ? "Update orientation content"
              : "Add new orientation content for students"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Content Details
            </CardTitle>
            <CardDescription>
              Fill in the details for the orientation content. Use markdown-like formatting
              in the content field (## for headers, - for bullet points, **bold**).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as CategoryId)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter content title..."
                aria-describedby={errors.title ? "title-error" : undefined}
              />
              {errors.title && (
                <p id="title-error" className="text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your content here...&#10;&#10;Use formatting:&#10;## Headers&#10;- Bullet points&#10;**Bold text**&#10;1. Numbered lists"
                rows={12}
                className="font-mono text-sm"
                aria-describedby={errors.content ? "content-error" : undefined}
              />
              {errors.content && (
                <p id="content-error" className="text-sm text-red-600">{errors.content}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {content.length}/10000 characters
              </p>
            </div>

            {/* Order */}
            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                className="max-w-32"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first within the category
              </p>
            </div>

            {/* Publish Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="published"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="published" className="cursor-pointer">
                Publish immediately (visible to students)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/staff/orientation">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : isEdit ? "Update Content" : "Create Content"}
          </Button>
        </div>
      </form>
    </div>
  );
}
