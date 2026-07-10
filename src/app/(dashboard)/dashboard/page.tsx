"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  MessageSquare,
  Calendar,
  FileText,
  Globe,
  BookOpen,
  Bot,
  Bell,
  Clock,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { AnnouncementCard } from "@/components/shared/AnnouncementCard";

const quickLinks = [
  {
    title: "Inquiries",
    description: "Submit and track your inquiries to the ISSO office",
    icon: MessageSquare,
    href: "/inquiries",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Appointments",
    description: "Book consultations with ISSO staff online or face-to-face",
    icon: Calendar,
    href: "/appointments",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Visa Tracking",
    description: "Monitor your visa status, documents, and renewal deadlines",
    icon: FileText,
    href: "/visa",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    title: "Exchange Programs",
    description: "Browse academic, cultural, and mobility programs available",
    icon: Globe,
    href: "/exchange",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Orientation",
    description: "Access guides on academics, culture, safety, and student life",
    icon: BookOpen,
    href: "/orientation",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    title: "AI Assistant",
    description: "Get instant answers in English, Filipino, Korean, or Chinese",
    icon: Bot,
    href: "/assistant",
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
];

const faqs = [
  {
    question: "How do I renew my student visa?",
    answer:
      "Navigate to the Visa Tracking module to see your current status and required documents. You will receive reminders 60, 30, 14, and 7 days before expiry.",
  },
  {
    question: "How can I book an appointment with ISSO?",
    answer:
      "Go to the Appointments section, select an available date and time slot, choose online or face-to-face, and describe the purpose of your visit.",
  },
  {
    question: "Where can I find information about exchange programs?",
    answer:
      "The Exchange Programs module lists all available academic, cultural, and mobility programs with eligibility requirements and deadlines.",
  },
];

export default function StudentDashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Student";

  const { data: stats } = trpc.dashboard.getStudentStats.useQuery(undefined, {
    enabled: !!session,
  });

  const { data: announcements } = trpc.dashboard.getRecentAnnouncements.useQuery(
    undefined,
    { enabled: !!session }
  );

  const getVisaStatusBadge = (status: string) => {
    switch (status) {
      case "VALID":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Valid</Badge>;
      case "EXPIRING_SOON":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Expiring Soon</Badge>;
      case "EXPIRED":
        return <Badge variant="destructive">Expired</Badge>;
      case "PENDING_RENEWAL":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pending Renewal</Badge>;
      default:
        return <Badge variant="secondary">N/A</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your ISSO services and recent activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Inquiries
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingInquiries ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Active inquiries awaiting response
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.upcomingAppointments ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled consultations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visa Status</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="mt-1">
              {getVisaStatusBadge(stats?.visaStatus ?? "N/A")}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Current visa status
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Notifications
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unreadNotifications ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Unread notifications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Announcements Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Announcements</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/announcements">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="space-y-4">
          {announcements && announcements.length > 0 ? (
            announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                title={announcement.title}
                content={announcement.content}
                author={`${announcement.author.firstName} ${announcement.author.lastName}`}
                date={announcement.publishedAt}
              />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No announcements at this time.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Links Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${link.bg}`}>
                      <link.icon className={`h-5 w-5 ${link.color}`} />
                    </div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {link.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{link.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          <HelpCircle className="inline-block h-5 w-5 mr-2" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {faq.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
