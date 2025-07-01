import { Card, CardContent } from "@/components/ui/card";
import UserCard from "./UserCard";
import { UserType } from "./UsersPage";

interface UsersListProps {
  users: UserType[];
  getTotalLevels: (user: UserType) => number;
  setSelectedUser: (user: UserType) => void;
  selectedUser: UserType | null;
}

export default function UsersList({
  users,
  getTotalLevels,
  setSelectedUser,
  selectedUser,
}: UsersListProps) {
  if (users.length === 0) {
    return (
      <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <CardContent className="py-8 flex justify-center items-center">
          <p className="text-gray-400 text-sm">
            No users found matching your search.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <>
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          getTotalLevels={getTotalLevels}
          setSelectedUser={setSelectedUser}
          selectedUser={selectedUser}
        />
      ))}
    </>
  );
}
