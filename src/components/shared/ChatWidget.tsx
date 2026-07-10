"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Floating chat widget - a simple button that links to the full AI assistant page.
 * Positioned fixed at the bottom-right of the viewport.
 * Kept simple to reduce complexity; a full embedded chat is available at /assistant.
 */
export function ChatWidget() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        asChild
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
        aria-label="Open AI Assistant"
      >
        <Link href="/assistant">
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </Link>
      </Button>
      {/* Pulse animation indicator */}
      <span className="absolute top-0 right-0 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
      </span>
    </div>
  );
}
