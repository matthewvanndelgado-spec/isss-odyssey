"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  FileText,
  Globe,
  BookOpen,
  Bot,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["STUDENT", "STAFF"],
  },
  {
    title: "Inquiries",
    href: "/inquiries",
    icon: MessageSquare,
    roles: ["STUDENT", "STAFF"],
  },
  {
    title: "Appointments",
    href: "/appointments",
    icon: Calendar,
    roles: ["STUDENT", "STAFF"],
  },
  {
    title: "Visa Tracking",
    href: "/visa",
    icon: FileText,
    roles: ["STUDENT", "STAFF"],
  },
  {
    title: "Exchange Programs",
    href: "/exchange",
    icon: Globe,
    roles: ["STUDENT", "STAFF"],
  },
  {
    title: "Orientation",
    href: "/orientation",
    icon: BookOpen,
    roles: ["STUDENT", "STAFF"],
  },
  {
    title: "AI Assistant",
    href: "/assistant",
    icon: Bot,
    roles: ["STUDENT"],
  },
  {
    title: "Staff Management",
    href: "/staff",
    icon: Users,
    roles: ["STAFF"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["STUDENT", "STAFF"],
  },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role ?? "STUDENT";

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">O</span>
          </div>
          <span className="text-lg font-bold tracking-tight">ODYSSEY</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {filteredNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          University of Batangas
        </p>
        <p className="text-xs text-muted-foreground text-center">
          ISSO - ODYSSEY v1.0
        </p>
      </div>
    </div>
  );
}
