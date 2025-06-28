"use client";

import * as React from "react";
import { Download, Search } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { fetchFilteredUsersData } from "../action";

import UsersList from "./UserList";

import { AccountType, UserTimeRange } from "../queries";
import { toast } from "sonner";
import { PDFDownloadLink } from "@react-pdf/renderer";
import UsersReportPDF from "./UsersReportPDF";
import { Button } from "@/components/ui/button";

export type UserType = {
  id: number;
  name: string;
  googleId: string;
  avatar: string;
  createdAt: string;
  isAnonymous: boolean;
  endless: number;
  vaults: number; // completed vault levels
  totalVaultsCreated: number; // total vaults user created
  vaultsCreatedWithPlays: {
    id: string; // UUID of the vault
    name: string; // name of the vault
    timesPlayed: number; // how many times this vault was played by users
  }[];
  boxoban: {
    medium: number;
    hard: number;
    unfiltered: number;
  };
};

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [usersData, setUsersData] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter by category
  const [accountTypeFilter, setAccountTypeFilter] =
    useState<AccountType>("all");

  // Report Generation
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("all");

  // For report generation
  const [reportTimeRange, setReportTimeRange] = useState<UserTimeRange>("all");
  const [reportAccountType, setReportAccountType] =
    useState<AccountType>("all");
  const [reportGeneratingLoading, setReportGeneratingLoading] = useState(false);

  {
    /* ---------- User screen fetch users data ---------- */
  }
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const users = await fetchFilteredUsersData({
          accountType: accountTypeFilter,
          searchTerm: "", // optional but you can pass empty here
          timeRange: "all",
        });
        setUsersData(users);
      } catch (err) {
        console.error("Error fetching users:", err);
        toast.error("Failed to fetch users. Please try again.");
        setError("Failed to fetch users. Try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [accountTypeFilter, timeRange]); // ✅ removed `searchTerm`

  const filteredUsers = usersData.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalLevels = (user: UserType) => {
    return (
      user.endless +
      user.boxoban.medium +
      user.boxoban.hard +
      user.boxoban.unfiltered
    );
  };

  const [reportUsers, setReportUsers] = useState<UserType[]>([]);
  const [isDownloadDialogOpen, setDownloadDialogOpen] = useState(false);

  const handleGeneratePDF = async () => {
    setReportGeneratingLoading(true);
    try {
      const users = await fetchFilteredUsersData({
        accountType: reportAccountType,
        searchTerm: "",
        timeRange: reportTimeRange,
      });
      setReportUsers(users);
      setDialogOpen(false); // ✅ close generation dialog
      setDownloadDialogOpen(true); // ✅ open download dialog
    } catch (err) {
      toast.error("Failed to generate PDF report.");
    } finally {
      setReportGeneratingLoading(false);
    }
  };

  const openDialog = () => {
    setReportTimeRange("all");
    setReportAccountType("all");
    setReportUsers([]); // Clear previous state
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-gray-400 text-sm m-0">
          Manage and view detailed information about your game users.
        </p>
      </div>

      {/* Filter + Search Row */}
      <div className="flex gap-2 items-center mb-2">
        <Select
          disabled={loading}
          value={accountTypeFilter}
          onValueChange={(value) =>
            setAccountTypeFilter(value as "all" | "google" | "guest")
          }
        >
          <SelectTrigger className="w-fit text-sm px-3 py-2 bg-white  text-black  focus:outline-none ">
            <SelectValue placeholder="Select account type" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-black text-black dark:text-white">
            <SelectItem value="all">All Accounts</SelectItem>
            <SelectItem value="google">Google Accounts</SelectItem>
            <SelectItem value="guest">Guest Accounts</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative border border-gray-300 rounded-md flex-1 flex justify-center items-center">
          <Search className="text-gray-300 ml-4 w-5 h-5" />
          <input
            disabled={loading}
            type="text"
            placeholder="Search users by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-3 py-2 bg-white border border-none rounded-md text-black text-sm w-full focus:outline-none focus:ring-0 focus:border-gray-400"
          />
        </div>

        {/* Open Dialog */}
        <Button
          onClick={openDialog}
          disabled={loading}
          className="flex justify-center items-center   bg-black text-white text-sm rounded-md hover:bg-gray-800 transition"
        >
          <Download className="w-6 h-6" />
          <span className="hidden md:block">Generate Report</span>
        </Button>
      </div>

      {/* Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-6">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Generate User Report
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-800">
                  Time Range
                </label>
                <Select
                  value={reportTimeRange}
                  onValueChange={(value) =>
                    setReportTimeRange(value as UserTimeRange)
                  }
                >
                  <SelectTrigger className="w-full bg-white text-black border border-gray-300 focus:ring-2 ring-offset-2 ring-blue-500">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                    <SelectItem value="last30days">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-800">
                  Account Type
                </label>
                <Select
                  value={reportAccountType}
                  onValueChange={(value) =>
                    setReportAccountType(value as AccountType)
                  }
                >
                  <SelectTrigger className="w-full bg-white text-black border border-gray-300 focus:ring-2 ring-offset-2 ring-blue-500">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                disabled={reportGeneratingLoading}
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border bg-white rounded-md hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGeneratePDF}
                disabled={reportGeneratingLoading}
                className="px-4 py-2 text-sm text-white  bg-black rounded-md hover:bg-gray-800"
              >
                {reportGeneratingLoading ? "Generating..." : "Generate PDF"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isDownloadDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-semibold">Report Ready</h3>
            <p className="text-sm text-gray-500">
              Click the button below to download the PDF.
            </p>
            <div className="flex justify-end">
              <PDFDownloadLink
                document={<UsersReportPDF users={reportUsers} />}
                fileName="user_report.pdf"
              >
                {({ loading, url }) =>
                  loading ? (
                    <Button
                      disabled
                      className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded-md"
                    >
                      Preparing...
                    </Button>
                  ) : (
                    <a
                      href={url!}
                      download="user_report.pdf"
                      onClick={() => {
                        setTimeout(() => {
                          setDownloadDialogOpen(false); // Close after short delay
                        }, 1000);
                      }}
                      className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800"
                    >
                      Download PDF
                    </a>
                  )
                }
              </PDFDownloadLink>
            </div>
          </div>
        </div>
      )}

      {/* Loading & Error */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-80">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
          <span className="text-gray-500">Loading graph...</span>
        </div>
      ) : error ? (
        <p className="text-red-500 mt-4">{error}</p>
      ) : (
        <>
          <div className="mt-4">
            <UsersList
              users={filteredUsers}
              getTotalLevels={getTotalLevels}
              setSelectedUser={setSelectedUser}
              selectedUser={selectedUser}
            />
          </div>

          {searchTerm && (
            <div className="mt-2 text-xs text-gray-500">
              Showing {filteredUsers.length} of {usersData.length} users
            </div>
          )}
        </>
      )}
    </div>
  );
}
