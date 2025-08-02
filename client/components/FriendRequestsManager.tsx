import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Users, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export function FriendRequestsManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search users query
  const { data: searchResults, isLoading: isSearching, refetch: searchUsers } = useQuery({
    queryKey: ['searchUsers', searchQuery],
    queryFn: () => apiClient.searchUsers(searchQuery),
    enabled: false // Manual trigger
  });

  // Get friend requests
  const { data: friendRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['friendRequests'],
    queryFn: () => apiClient.getFriendRequests()
  });

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: (email: string) => apiClient.sendFriendRequest(email),
    onSuccess: () => {
      toast({ title: 'Friend request sent successfully!' });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error sending friend request',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: (email: string) => apiClient.acceptFriendRequest(email),
    onSuccess: () => {
      toast({ title: 'Friend request accepted!' });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error accepting friend request',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Reject friend request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: (email: string) => apiClient.rejectFriendRequest(email),
    onSuccess: () => {
      toast({ title: 'Friend request rejected' });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error rejecting friend request',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchUsers();
    }
  };

  const handleSendRequest = (email: string) => {
    sendRequestMutation.mutate(email);
  };

  const handleAcceptRequest = (email: string) => {
    acceptRequestMutation.mutate(email);
  };

  const handleRejectRequest = (email: string) => {
    rejectRequestMutation.mutate(email);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Friend Requests & Roommate Management
        </CardTitle>
        <CardDescription>
          Search for users, send friend requests, and manage your roommates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">
              <Search className="w-4 h-4 mr-2" />
              Search Users
            </TabsTrigger>
            <TabsTrigger value="received" className="relative">
              <UserCheck className="w-4 h-4 mr-2" />
              Received
              {friendRequests?.received?.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {friendRequests.received.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">
              <Clock className="w-4 h-4 mr-2" />
              Sent Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {searchResults?.users && (
              <div className="space-y-2">
                <h4 className="font-medium">Search Results:</h4>
                {searchResults.users.length === 0 ? (
                  <Alert>
                    <AlertDescription>No users found matching your search.</AlertDescription>
                  </Alert>
                ) : (
                  searchResults.users.map((user) => (
                    <motion.div
                      key={user.email}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(user.email)}
                        disabled={sendRequestMutation.isPending}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Friend
                      </Button>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Received Friend Requests:</h4>
              {isLoadingRequests ? (
                <div className="text-center py-4">Loading...</div>
              ) : friendRequests?.received?.length === 0 ? (
                <Alert>
                  <AlertDescription>No pending friend requests.</AlertDescription>
                </Alert>
              ) : (
                friendRequests?.received?.map((user) => (
                  <motion.div
                    key={user.email}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(user.email)}
                        disabled={acceptRequestMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(user.email)}
                        disabled={rejectRequestMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Sent Friend Requests:</h4>
              {isLoadingRequests ? (
                <div className="text-center py-4">Loading...</div>
              ) : friendRequests?.sent?.length === 0 ? (
                <Alert>
                  <AlertDescription>No pending sent requests.</AlertDescription>
                </Alert>
              ) : (
                friendRequests?.sent?.map((user) => (
                  <motion.div
                    key={user.email}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
