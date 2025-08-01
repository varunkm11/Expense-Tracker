import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NavigationBar } from "@/components/NavigationBar";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Users, Plus, Trash2, Edit3, Settings, UserCheck, Crown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiClient } from '@/lib/api-client';

interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  roommates: string[];
  createdAt: string;
}

interface SystemStats {
  totalUsers: number;
  totalExpenses: number;
  totalIncome: number;
  totalAdmins: number;
}

export default function AdminPanel() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [newRoommate, setNewRoommate] = useState('');
  const [editingRoommate, setEditingRoommate] = useState<{old: string, new: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchUsers();
      fetchStats();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRoommate = async () => {
    if (!newRoommate.trim()) return;

    try {
      const response = await fetch('/api/auth/add-roommate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ name: newRoommate.trim() })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Roommate added successfully"
        });
        setNewRoommate('');
        fetchUsers();
        await refreshUser(); // Refresh user data to update roommates display
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to add roommate",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add roommate",
        variant: "destructive"
      });
    }
  };

  const removeRoommate = async (roommateName: string) => {
    try {
      const response = await fetch('/api/auth/remove-roommate', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ name: roommateName })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Roommate removed successfully"
        });
        fetchUsers();
        await refreshUser(); // Refresh user data to update roommates display
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to remove roommate",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove roommate",
        variant: "destructive"
      });
    }
  };

  const editRoommate = async () => {
    if (!editingRoommate || !editingRoommate.new.trim()) return;

    try {
      const response = await fetch('/api/auth/edit-roommate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ 
          oldName: editingRoommate.old, 
          newName: editingRoommate.new.trim() 
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Roommate updated successfully"
        });
        setEditingRoommate(null);
        fetchUsers();
        await refreshUser(); // Refresh user data to update roommates display
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update roommate",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update roommate",
        variant: "destructive"
      });
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have admin privileges to access this panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900">
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-6 pt-20">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Crown className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage users, roommates, and system settings</p>
            </div>
          </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-2xl font-bold">{stats.totalUsers}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <span className="text-2xl font-bold">₹{stats.totalExpenses.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <span className="text-2xl font-bold">₹{stats.totalIncome.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-2xl font-bold">{stats.totalAdmins}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="roommates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roommates">Roommate Management</TabsTrigger>
          <TabsTrigger value="users">User Overview</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        {/* Roommate Management */}
        <TabsContent value="roommates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Roommate</CardTitle>
              <CardDescription>Add a new roommate to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="new-roommate">Roommate Name</Label>
                  <Input
                    id="new-roommate"
                    value={newRoommate}
                    onChange={(e) => setNewRoommate(e.target.value)}
                    placeholder="Enter roommate name"
                    onKeyPress={(e) => e.key === 'Enter' && addRoommate()}
                  />
                </div>
                <Button onClick={addRoommate} className="mt-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Roommate
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Roommates</CardTitle>
              <CardDescription>Manage existing roommates</CardDescription>
            </CardHeader>
            <CardContent>
              {user?.roommates && user.roommates.length > 0 ? (
                <div className="space-y-3">
                  {user.roommates.map((roommate, index) => (
                    <div key={`roommate-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                      {editingRoommate?.old === roommate ? (
                        <div className="flex gap-2 flex-1">
                          <Input
                            value={editingRoommate.new}
                            onChange={(e) => setEditingRoommate({...editingRoommate, new: e.target.value})}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={editRoommate}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingRoommate(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium">{roommate}</span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingRoommate({old: roommate, new: roommate})}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeRoommate(roommate)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No roommates found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Overview */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Overview of all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Roommates</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userItem) => (
                    <TableRow key={userItem._id}>
                      <TableCell className="font-medium">{userItem.name}</TableCell>
                      <TableCell>{userItem.email}</TableCell>
                      <TableCell>
                        {userItem.isAdmin ? (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Crown className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <UserCheck className="h-3 w-3 mr-1" />
                            User
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{userItem.roommates?.length || 0}</TableCell>
                      <TableCell>{new Date(userItem.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Current system configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Admin Code:</strong> EXPENSE_ADMIN_2024
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertDescription>
                    <strong>Note:</strong> Only users who register with the admin code will receive admin privileges.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
}
