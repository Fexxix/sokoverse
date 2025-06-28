// app/actions/adminStats.action.ts

"use server";
import { UserType } from "./(components)/UsersPage";
import {
  fetchUserSignupsGroupedByDate,
  FilterOptions,
  getFilteredUsers,
  getUsersDataCountQuery,
} from "./queries";

export async function fetchUsersDataCount() {
  try {
    const stats = await getUsersDataCountQuery();
    return stats;
  } catch (error) {
    console.error("Failed to fetch user data count:", error);
    return {
      totalUsers: 0,
      endlessPlayed: 0,
      vaultPlayed: 0,
      boxobanPlayed: 0,
    };
  }
}

export async function fetchUserSignupGraphDataAction() {
  try {
    const result = await fetchUserSignupsGroupedByDate();
    return result;
  } catch (error) {
    console.error("Failed to fetch signup graph data:", error);
    return [];
  }
}

export async function fetchFilteredUsersData(
  filters: FilterOptions
): Promise<UserType[]> {
  try {
    const users = await getFilteredUsers(filters);
    return users;
  } catch (error) {
    console.error("Error fetching filtered users:", error);
    return [];
  }
}
