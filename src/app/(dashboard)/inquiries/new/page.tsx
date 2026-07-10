"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
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

const categories = [
  { value: "VISA", label: "Visa & Immigration" },
  { value: "ACADEMIC", label: "Academic" },
  { value: "FINANCIAL", label: "Financial" },
  { value: "HOUSING", label: "Housing" },
  { value: "GENERAL", label: "General" },
];

export default function NewInquiryPage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createInquiry = trpc.inquiry.create.useMutation({
    onSuccess: () => {
      router.push("/inquiries");
    },
    onError: (error) => {
      if (error.data?.code === "BAD_REQUEST") {
        setErrors({ form: error.message });
      } else {
        setErrors({ form: "Something went wrong. Please try again." });
      }
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!category) {
      newErrors.category = "Please select a category";
    }
    if (!subject || subject.length < 5) {
      newErrors.subject = "Subject must be at least 5 characters";
    }
    if (subject.length > 200) {
      newErrors.subject = "Subject must be less than 200 characters";
    }
    if (!description || description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }
    if (description.length > 2000) {
      newErrors.description = "Description must be less than 2000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    createInquiry.mutate({
      category: category as "VISA" | "ACADEMIC" | "FINANCIAL" | "HOUSING" | "GENERAL",
      subject,
      description,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/inquiries" aria-label="Back to inquiries">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Inquiry</h1>
          <p className="text-muted-foreground mt-1">
            Submit a new inquiry to the ISSO office
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Inquiry Details</CardTitle>
          <CardDescription>
            Fill in the details below. Our staff will respond as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.form && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {errors.form}
              </div>
            )}

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" aria-label="Select category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category}</p>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief summary of your inquiry"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                aria-describedby="subject-help"
              />
              <div className="flex justify-between">
                {errors.subject ? (
                  <p className="text-sm text-destructive">{errors.subject}</p>
                ) : (
                  <p id="subject-help" className="text-sm text-muted-foreground">
                    Min 5 characters
                  </p>
                )}
                <span className="text-sm text-muted-foreground">
                  {subject.length}/200
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about your inquiry. Include any relevant context, dates, or reference numbers."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                maxLength={2000}
                className="resize-none"
                aria-describedby="description-help"
              />
              <div className="flex justify-between">
                {errors.description ? (
                  <p className="text-sm text-destructive">{errors.description}</p>
                ) : (
                  <p id="description-help" className="text-sm text-muted-foreground">
                    Min 20 characters. Be as detailed as possible.
                  </p>
                )}
                <span className="text-sm text-muted-foreground">
                  {description.length}/2000
                </span>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" asChild>
                <Link href="/inquiries">Cancel</Link>
              </Button>
              <Button type="submit" disabled={createInquiry.isLoading}>
                {createInquiry.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Inquiry
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
