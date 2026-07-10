"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Globe2,
  ShieldAlert,
  Heart,
  Building2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";

const CATEGORIES = [
  { id: "ACADEMIC", label: "Academic", icon: GraduationCap, color: "text-blue-600" },
  { id: "CULTURAL", label: "Cultural", icon: Globe2, color: "text-purple-600" },
  { id: "SAFETY_EMERGENCY", label: "Safety & Emergency", icon: ShieldAlert, color: "text-red-600" },
  { id: "STUDENT_LIFE", label: "Student Life", icon: Heart, color: "text-pink-600" },
  { id: "ABOUT_UB_ISSO", label: "About UB/ISSO", icon: Building2, color: "text-amber-600" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

export default function OrientationPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("ACADEMIC");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: content, isLoading } = trpc.orientation.getAll.useQuery(
    searchQuery
      ? { search: searchQuery }
      : { category: activeCategory }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orientation Center</h1>
        <p className="text-muted-foreground mt-1">
          Essential information for international students at UB
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search orientation content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          aria-label="Search orientation content"
        />
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Orientation categories">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <Button
                key={category.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className={`gap-2 transition-all ${
                  isActive ? "" : "hover:bg-muted"
                }`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`category-panel-${category.id}`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "" : category.color}`} />
                {category.label}
              </Button>
            );
          })}
        </div>
      )}

      {/* Content Grid */}
      <div
        id={`category-panel-${activeCategory}`}
        role="tabpanel"
        aria-label={`${CATEGORIES.find((c) => c.id === activeCategory)?.label} content`}
      >
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-1" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : content && content.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.map((item) => {
              const category = CATEGORIES.find((c) => c.id === item.category);
              const Icon = category?.icon ?? BookOpen;
              return (
                <Link key={item.id} href={`/orientation/${item.id}`}>
                  <Card className="h-full hover:shadow-md transition-all hover:border-primary/20 cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors`}>
                          <Icon className={`h-4 w-4 ${category?.color ?? "text-gray-600"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                            {item.title}
                          </CardTitle>
                          {searchQuery && (
                            <CardDescription className="text-xs mt-1">
                              {category?.label}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {item.content.replace(/[#*_`]/g, "").slice(0, 150)}
                        {item.content.length > 150 ? "..." : ""}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No content found</p>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "No orientation content available for this category yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
