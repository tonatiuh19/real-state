import React, { useState } from "react";
import {
  LayoutDashboard,
  Kanban,
  Users,
  CheckCircle2,
  Megaphone,
  Briefcase,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  Mail,
  MessageCircle,
  FileText,
  History,
  TrendingUp,
  Shield,
  Bell,
  UserCog,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout, validateSession } from "@/store/slices/brokerAuthSlice";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, sessionToken, isAuthenticated } = useAppSelector(
    (state) => state.brokerAuth,
  );

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!sessionToken) {
      navigate("/broker-login");
    }
  }, [sessionToken, navigate]);

  // Validate session and load user data on mount
  React.useEffect(() => {
    if (!user && sessionToken) {
      dispatch(validateSession());
    }
  }, [dispatch, user, sessionToken]);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await dispatch(logout());
    navigate("/broker-login");
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Overview",
      icon: <LayoutDashboard className="h-4 w-4" />,
      path: "/admin",
    },
    {
      id: "pipeline",
      label: "Pipeline",
      icon: <Kanban className="h-4 w-4" />,
      path: "/admin/pipeline",
    },
    {
      id: "clients",
      label: "Clients & Leads",
      icon: <Users className="h-4 w-4" />,
      path: "/admin/clients",
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: <CheckCircle2 className="h-4 w-4" />,
      path: "/admin/tasks",
    },
    // {
    //   id: "marketing",
    //   label: "Marketing & Campaigns",
    //   icon: <Megaphone className="h-4 w-4" />,
    //   path: "/admin/marketing",
    // },
    {
      id: "documents",
      label: "Documents",
      icon: <Briefcase className="h-4 w-4" />,
      path: "/admin/documents",
    },
    {
      id: "communication-templates",
      label: "Communications",
      icon: <Mail className="h-4 w-4" />,
      path: "/admin/communication-templates",
    },
    {
      id: "conversations",
      label: "Conversations",
      icon: <MessageCircle className="h-4 w-4" />,
      path: "/admin/conversations",
      disabled: true,
    },
    {
      id: "reports",
      label: "Reports & Analytics",
      icon: <TrendingUp className="h-4 w-4" />,
      path: "/admin/reports",
    },
    // {
    //   id: "compliance",
    //   label: "Compliance",
    //   icon: <Shield className="h-4 w-4" />,
    //   path: "/admin/compliance",
    // },
    // {
    //   id: "notifications",
    //   label: "Notifications",
    //   icon: <Bell className="h-4 w-4" />,
    //   path: "/admin/notifications",
    // },
    {
      id: "brokers",
      label: "Broker Management",
      icon: <UserCog className="h-4 w-4" />,
      path: "/admin/brokers",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      path: "/admin/settings",
      disabled: true,
    },
  ];

  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden border-r bg-background md:flex md:flex-col transition-all duration-300 h-screen",
          sidebarCollapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo & Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {!sidebarCollapsed ? (
            <>
              <img
                src="https://disruptinglabs.com/data/encore/assets/images/logo.png"
                alt="Encore Mortgage"
                className="h-10 w-auto"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-8 w-8 hover:bg-primary/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-center w-full">
              <img
                src="https://disruptinglabs.com/data/encore/assets/images/favicon/favicon.ico"
                alt="Encore Mortgage"
                className="h-6 w-auto cursor-pointer"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="flex-1 space-y-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {menuItems.map((item) => {
            const menuButton = (
              <Button
                key={item.id}
                variant={
                  location.pathname === item.path ? "secondary" : "ghost"
                }
                className={cn(
                  "w-full gap-3",
                  sidebarCollapsed ? "justify-center px-2" : "justify-start",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "",
                  item.disabled
                    ? "opacity-60 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                    : "",
                )}
                onClick={() => {
                  if (!item.disabled) navigate(item.path);
                }}
                aria-disabled={item.disabled}
                title={
                  sidebarCollapsed && !item.disabled ? item.label : undefined
                }
              >
                {item.icon}
                {!sidebarCollapsed && (
                  <>
                    <span>{item.label}</span>
                    {item.disabled && <Lock className="h-3.5 w-3.5 ml-auto" />}
                  </>
                )}
                {sidebarCollapsed && item.disabled && (
                  <Lock className="h-3.5 w-3.5 absolute top-1.5 right-1.5" />
                )}
              </Button>
            );

            if (!item.disabled) {
              return menuButton;
            }

            return (
              <Tooltip key={item.id} delayDuration={250}>
                <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                <TooltipContent side={sidebarCollapsed ? "right" : "top"}>
                  <p>Coming soon</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* User Section */}
        <div className="border-t p-4">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 group">
              <button
                type="button"
                onClick={() => navigate("/admin/profile")}
                className="focus:outline-none"
              >
                <Avatar className="h-9 w-9 ring-2 ring-primary/20 cursor-pointer hover:ring-primary/50 transition-all">
                  {(user as any)?.avatar_url ? (
                    <img
                      src={(user as any).avatar_url}
                      alt="Profile"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.first_name?.charAt(0) || "A"}
                    </AvatarFallback>
                  )}
                </Avatar>
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/profile")}
                className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
              >
                <p className="text-sm font-medium truncate">
                  {user ? `${user.first_name} ${user.last_name}` : "Admin User"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role || "broker"}
                </p>
              </button>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => setShowLogoutConfirm(true)}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  <p>Sign Out</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Avatar className="h-9 w-9">
                      {(user as any)?.avatar_url ? (
                        <img
                          src={(user as any).avatar_url}
                          alt="Profile"
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {user?.first_name?.charAt(0) || "A"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      {(user as any)?.avatar_url ? (
                        <img
                          src={(user as any).avatar_url}
                          alt="Profile"
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user?.first_name?.charAt(0) || "A"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user
                          ? `${user.first_name} ${user.last_name}`
                          : "Admin User"}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {user?.role || "broker"}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2"
                    onClick={() => navigate("/admin/profile")}
                  >
                    <UserCog className="h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => setShowLogoutConfirm(true)}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen">{children}</main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to log in again to
              access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminLayout;
