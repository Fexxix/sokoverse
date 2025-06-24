// app/actions/adminStats.action.ts

"use server";
import { getAllUsersData, getUsersDataCountQuery } from "./queries";

export async function fetchUsersDataCount() {
  const stats = await getUsersDataCountQuery();
  return stats;
}

export async function fetchAllUsersData() {
  const users = await getAllUsersData();
  return users;
}
