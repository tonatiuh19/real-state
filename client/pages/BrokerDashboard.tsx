import React, { useState } from "react";
import { 
  BarChart3, 
  Users, 
  FileText, 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  LayoutDashboard,
  Kanban,
  Megaphone,
  Briefcase
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const data = [
  { name: "Mon", apps: 12, closed: 8 },
  { name: "Tue", apps: 19, closed: 12 },
  { name: "Wed", apps: 15, closed: 10 },
  { name: "Thu", apps: 22, closed: 18 },
  { name: "Fri", apps: 30, closed: 24 },
  { name: "Sat", apps: 10, closed: 5 },
  { name: "Sun", apps: 8, closed: 3 },
];

const BrokerDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar - Desktop Only for this layout */}
      <aside className="hidden w-64 border-r bg-background md:block">
        <div className="flex h-16 items-center px-6">
          <span className="text-lg font-bold">Admin Panel</span>
        </div>
        <div className="space-y-1 p-4">
          {[
            { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
            { id: "pipeline", label: "Pipeline", icon: <Kanban className="h-4 w-4" /> },
            { id: "clients", label: "Clients & Leads", icon: <Users className="h-4 w-4" /> },
            { id: "tasks", label: "Tasks", icon: <CheckCircle2 className="h-4 w-4" /> },
            { id: "marketing", label: "Marketing", icon: <Megaphone className="h-4 w-4" /> },
            { id: "documents", label: "Documents", icon: <Briefcase className="h-4 w-4" /> },
            { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
          ].map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                activeTab === item.id ? "bg-primary/10 text-primary hover:bg-primary/20" : ""
              )}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="text-muted-foreground">Manage your brokerage operations efficiently.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-xs md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search everything..." className="pl-9" />
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Loan
            </Button>
          </div>
        </header>

        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Total Pipeline", value: "$42.8M", change: "+12.5%", trend: "up", icon: <TrendingUp className="text-emerald-500" /> },
                { title: "Active Applications", value: "84", change: "+4", trend: "up", icon: <Users className="text-blue-500" /> },
                { title: "Avg. Closing Time", value: "18 Days", change: "-2 Days", trend: "up", icon: <Clock className="text-amber-500" /> },
                { title: "Closure Rate", value: "92%", change: "+2.1%", trend: "up", icon: <CheckCircle2 className="text-emerald-500" /> }
              ].map((stat, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    {stat.icon}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <span className={stat.trend === "up" ? "text-emerald-500" : "text-destructive"}>
                        {stat.change}
                      </span>
                      from last month
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Application Volume</CardTitle>
                  <CardDescription>Daily new applications vs closed loans.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                        itemStyle={{ fontSize: "12px" }}
                      />
                      <Bar dataKey="apps" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="closed" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Revenue Forecast</CardTitle>
                  <CardDescription>Projected commission for the next 30 days.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="apps" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorApps)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Pipeline Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Pipeline</CardTitle>
                  <CardDescription>Recent loan applications and their current status.</CardDescription>
                </div>
                <Button variant="outline" size="sm">View All</Button>
              </CardHeader>
              <CardContent>
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Client</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Loan Type</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Next Task</th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {[
                        { client: "Sarah Johnson", type: "Conventional 30Y", amount: "$450,000", status: "Underwriting", next: "Income Verification", color: "bg-blue-500" },
                        { client: "Michael Chen", type: "FHA Purchase", amount: "$320,000", status: "Processing", next: "Property Appraisal", color: "bg-amber-500" },
                        { client: "Robert Wilson", type: "VA Refinance", amount: "$580,000", status: "Closing", next: "Final Disclosure", color: "bg-emerald-500" },
                        { client: "Emma Davis", type: "Jumbo Loan", amount: "$1,200,000", status: "Docs Needed", next: "Bank Statements", color: "bg-destructive" }
                      ].map((row, i) => (
                        <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">{row.client}</td>
                          <td className="p-4 align-middle">{row.type}</td>
                          <td className="p-4 align-middle font-semibold">{row.amount}</td>
                          <td className="p-4 align-middle">
                            <Badge className={cn("text-white", row.color)}>{row.status}</Badge>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{row.next}</span>
                            </div>
                          </td>
                          <td className="p-4 align-middle text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="gap-2"><Mail className="h-4 w-4" /> Message</DropdownMenuItem>
                                <DropdownMenuItem className="gap-2"><FileText className="h-4 w-4" /> View Docs</DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-destructive"><AlertCircle className="h-4 w-4" /> Flag Issue</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab !== "overview" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-primary/5 p-8 mb-4">
              <Settings className="h-12 w-12 text-primary animate-spin-slow" />
            </div>
            <h2 className="text-2xl font-bold">Under Construction</h2>
            <p className="text-muted-foreground max-w-md mx-auto mt-2">
              The {activeTab} module is currently being optimized. Continue prompting to complete the full implementation of this section.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => setActiveTab("overview")}>
              Back to Overview
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default BrokerDashboard;
