import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import UserDetailPanel from "./UserDetailPanel";
import { UserType } from "./UsersPage";

interface UserCardProps {
  user: UserType;
  getTotalLevels: (user: UserType) => number;
  setSelectedUser: (user: UserType) => void;
  selectedUser: UserType | null;
}

export default function UserCard({
  user,
  getTotalLevels,
  setSelectedUser,
  selectedUser,
}: UserCardProps) {
  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "Unknown";

  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
      <CardContent className="flex justify-between items-center gap-6 flex-wrap py-6">
        {/* Left: Avatar + Basic Info */}
        <div className="flex gap-4 items-center">
          <Avatar className="h-14 w-14 rounded-full bg-gray-100">
            <AvatarImage
              src={
                user.avatar?.startsWith("http")
                  ? user.avatar
                  : "/placeholder-user.svg"
              }
              alt={user.name}
            />
            <AvatarFallback className="bg-gray-200 text-gray-500 flex items-center justify-center h-full w-full">
              <User />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-black text-lg">{user.name}</h3>
            <p className="text-black text-sm">{user.googleId}</p>
            <p className="text-xs mt-1 text-gray-700">
              User ID: <span>{user.id}</span>
            </p>
            <div className="text-xs text-gray-700 mt-1">
              Account Type:{" "}
              <Badge
                variant="secondary"
                className={
                  user.isAnonymous
                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                    : "bg-green-100 text-green-800 hover:bg-green-100"
                }
              >
                {user.isAnonymous ? "Guest Account" : "Google Account"}
              </Badge>
            </div>
            <p className="text-xs text-gray-700 mt-1">
              Joined: <span>{formattedDate}</span>
            </p>
          </div>
        </div>

        {/* Right: Stats + View Button */}
        <div className="flex items-center gap-2">
          <Badge className="text-black border-gray-300" variant="outline">
            {getTotalLevels(user) + user.vaults} levels played
          </Badge>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUser(user)}
                className="flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-white text-black">
              <SheetHeader>
                <SheetTitle>User Details</SheetTitle>
                <SheetDescription>
                  Detailed info for {user.name}
                </SheetDescription>
              </SheetHeader>

              {selectedUser && selectedUser.id === user.id && (
                <>
                  <UserDetailPanel user={selectedUser} />
                </>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </CardContent>
    </Card>
  );
}
