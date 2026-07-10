"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";

export default function StaffAnnouncementsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const utils = trpc.useUtils();

  const { data: announcements, isLoading } = trpc.dashboard.getAnnouncements.useQuery();

  const createMutation = trpc.dashboard.createAnnouncement.useMutation({
    onSuccess: () => {
      utils.dashboard.getAnnouncements.invalidate();
      resetForm();
    },
  });

  const updateMutation = trpc.dashboard.updateAnnouncement.useMutation({
    onSuccess: () => {
      utils.dashboard.getAnnouncements.invalidate();
      resetForm();
    },
  });

  const deleteMutation = trpc.dashboard.deleteAnnouncement.useMutation({
    onSuccess: () => {
      utils.dashboard.getAnnouncements.invalidate();
    },
  });

  const toggleMutation = trpc.dashboard.toggleAnnouncement.useMutation({
    onSuccess: () => {
      utils.dashboard.getAnnouncements.invalidate();
    },
  });

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditId(null);
    setIsCreateOpen(false);
    setErrors({});
  };

  const handleEdit = (announcement: { id: string; title: string; content: string }) => {
    setEditId(announcement.id);
    setTitle(announcement.title);
    setContent(announcement.content);
    setIsCreateOpen(true);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (title.length < 3) newErrors.title = "Title must be at least 3 characters";
    if (content.length < 10) newErrors.content = "Content must be at least 10 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (editId) {
      updateMutation.mutate({ id: editId, title, content });
    } else {
      createMutation.mutate({ title, content });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggle = (id: string, isActive: boolean) => {
    toggleMutation.mutate({ id, isActive: !isActive });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-1">
            Manage announcements visible to all students
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsCreateOpen(open); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
              <DialogDescription>
                {editId
                  ? "Update the announcement details below."
                  : "Create a new announcement for all students."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="announcement-title">Title</Label>
                <Input
                  id="announcement-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title..."
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="announcement-content">Content</Label>
                <Textarea
                  id="announcement-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Announcement content..."
                  rows={5}
                />
                {errors.content && (
                  <p className="text-sm text-red-600">{errors.content}</p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : editId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : announcements && announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{announcement.title}</p>
                      <Badge
                        variant="secondary"
                        className={
                          announcement.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {announcement.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Published {format(new Date(announcement.publishedAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(announcement.id, announcement.isActive)}
                      title={announcement.isActive ? "Deactivate" : "Activate"}
                    >
                      {announcement.isActive ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(announcement)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(announcement.id)}
                      disabled={deleteMutation.isPending}
                      className="hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No announcements yet</p>
            <p className="text-muted-foreground mb-4">
              Create your first announcement to inform students
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
