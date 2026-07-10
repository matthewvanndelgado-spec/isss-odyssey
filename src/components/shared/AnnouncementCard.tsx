"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AnnouncementCardProps {
  title: string;
  content: string;
  author: string;
  date: Date | string;
}

export function AnnouncementCard({
  title,
  content,
  author,
  date,
}: AnnouncementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const isLong = content.length > 150;
  const displayContent = isExpanded ? content : content.slice(0, 150);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base font-semibold leading-tight">
            {title}
          </CardTitle>
          <time className="text-xs text-muted-foreground whitespace-nowrap">
            {formattedDate}
          </time>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {displayContent}
          {isLong && !isExpanded && "..."}
        </p>
        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Read more <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
        <div className="flex items-center gap-1.5 pt-1">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{author}</span>
        </div>
      </CardContent>
    </Card>
  );
}
