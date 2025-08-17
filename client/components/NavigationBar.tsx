import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FriendRequestsManager } from "@/components/FriendRequestsManager";
import { 
  IndianRupee, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Settings, 
  Users, 
  LogOut,
  Home,
  Brain,
  CalendarDays,
  Target,
  UserPlus
} from 'lucide-react';

export function NavigationBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isFriendDialogOpen, setIsFriendDialogOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/monthly-summary', icon: CalendarDays, label: 'Monthly' },
    { path: '/budget', icon: Target, label: '50/30/20' },
    { path: '/insights', icon: Brain, label: 'AI Insights' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-orange-200 dark:border-slate-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <IndianRupee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mystic Zone</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Smart Expense Tracker</p>
            </div>
          </Link>

          {/* Navigation Items - Only show if user is logged in */}
          {user && (
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button 
                      variant={isActive(item.path) ? "default" : "ghost"} 
                      size="sm"
                      className="h-9"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center space-x-3">
            {user && (
              <>
                <Dialog open={isFriendDialogOpen} onOpenChange={setIsFriendDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friends
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Friend Requests & Management</DialogTitle>
                      <DialogDescription>
                        Manage your friend requests and connections for split expenses
                      </DialogDescription>
                    </DialogHeader>
                    <FriendRequestsManager />
                  </DialogContent>
                </Dialog>
                
                <div className="text-sm text-muted-foreground hidden sm:block">
                  Welcome, <span className="font-medium text-foreground">{user?.name}</span>
                </div>
              </>
            )}

            <ThemeToggle />
            
            {user && (
              <Button variant="ghost" size="sm" onClick={logout} className="h-9 w-9 px-0">
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-center space-x-1 mt-3 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <Button 
                  variant={isActive(item.path) ? "default" : "ghost"} 
                  size="sm"
                  className="h-8 px-2"
                >
                  <Icon className="w-3 h-3 mr-1" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
