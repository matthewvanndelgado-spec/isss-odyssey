"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Globe,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const PROGRAM_TYPES = [
  { value: "ACADEMIC", label: "Academic Exchange" },
  { value: "CULTURAL", label: "Cultural Exchange" },
  { value: "MOBILITY", label: "Student Mobility" },
];

function CreateEditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("ACADEMIC");
  const [eligibility, setEligibility] = useState("");
  const [deadline, setDeadline] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const utils = trpc.useUtils();

  // Fetch existing program if editing
  const { data: existingProgram } = trpc.exchange.getById.useQuery(
    { id: editId! },
    { enabled: isEditing }
  );

  useEffect(() => {
    if (existingProgram) {
      setTitle(existingProgram.title);
      setDescription(existingProgram.description);
      setType(existingProgram.type);
      setEligibility(existingProgram.eligibility ?? "");
      setDeadline(existingProgram.deadline ? format(new Date(existingProgram.deadline), "yyyy-MM-dd") : "");
      setApplicationUrl(existingProgram.applicationUrl ?? "");
    }
  }, [existingProgram]);

  const createMutation = trpc.exchange.create.useMutation({
    onSuccess: () => {
      utils.exchange.getAll.invalidate();
      router.push("/staff/exchange");
    },
  });

  const updateMutation = trpc.exchange.update.useMutation({
    onSuccess: () => {
      utils.exchange.getAll.invalidate();
      router.push("/staff/exchange");
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title || title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }
    if (!description || description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }
    if (!type) {
      newErrors.type = "Please select a program type";
    }
    if (applicationUrl && !applicationUrl.startsWith("http")) {
      newErrors.applicationUrl = "Must be a valid URL starting with http";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      title,
      description,
      type: type as "ACADEMIC" | "CULTURAL" | "MOBILITY",
      eligibility: eligibility || undefined,
      deadline: deadline || undefined,
      applicationUrl: applicationUrl || undefined,
    };

    if (isEditing && editId) {
      updateMutation.mutate({ id: editId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/staff/exchange">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Programs
        </Link>
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? "Edit Program" : "Create Exchange Program"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isEditing
            ? "Update the exchange program details"
            : "Add a new exchange program for students to browse and apply"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Program Details
            </CardTitle>
            <CardDescription>
              Fill in all required fields to create the program listing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Program Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer Academic Exchange - Tokyo University"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "title-error" : undefined}
              />
              {errors.title && (
                <p id="title-error" className="text-xs text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Program Type <span className="text-red-500">*</span>
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type" aria-invalid={!!errors.type}>
                  <SelectValue placeholder="Select program type" />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAM_TYPES.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value}>
                      {pt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-xs text-red-500">{errors.type}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the program, its benefits, and what students can expect..."
                rows={5}
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? "desc-error" : undefined}
              />
              <div className="flex justify-between">
                {errors.description && (
                  <p id="desc-error" className="text-xs text-red-500">{errors.description}</p>
                )}
                <p className="text-xs text-muted-foreground ml-auto">
                  {description.length}/5000
                </p>
              </div>
            </div>

            {/* Eligibility */}
            <div className="space-y-2">
              <Label htmlFor="eligibility">Eligibility Requirements</Label>
              <Textarea
                id="eligibility"
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
                placeholder="List eligibility requirements (one per line)&#10;e.g., Minimum GPA of 2.5&#10;Must be enrolled full-time&#10;Completed at least 2 semesters"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Enter each requirement on a new line
              </p>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline">Application Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for open enrollment programs
              </p>
            </div>

            {/* Application URL */}
            <div className="space-y-2">
              <Label htmlFor="applicationUrl">External Application URL</Label>
              <Input
                id="applicationUrl"
                type="url"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                placeholder="https://partner-university.edu/apply"
                aria-invalid={!!errors.applicationUrl}
              />
              {errors.applicationUrl && (
                <p className="text-xs text-red-500">{errors.applicationUrl}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Optional link to an external application portal
              </p>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" disabled={isPending}>
                <Save className="h-4 w-4 mr-2" />
                {isPending
                  ? "Saving..."
                  : isEditing
                    ? "Update Program"
                    : "Create Program"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/staff/exchange">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

export default function CreateEditExchangeProgramPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-2xl">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <CreateEditForm />
    </Suspense>
  );
}