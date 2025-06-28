import * as React from "react";
import { User, GamepadIcon, Shield, Zap, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SingleUserPDF from "./SingleUserPDF";
import { UserType } from "./UsersPage";

interface UserDetailPanelProps {
  user: UserType;
}

export default function UserDetailPanel({ user }: UserDetailPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const totalBoxoban =
    user.boxoban.medium + user.boxoban.hard + user.boxoban.unfiltered;
  const totalLevels = user.endless + totalBoxoban;

  function generateUserReport(user: UserType) {
    const totalBoxoban =
      user.boxoban.medium + user.boxoban.hard + user.boxoban.unfiltered;
    const totalLevels = user.endless + totalBoxoban;

    const headers = [
      "User ID",
      "Name",
      "Google ID",
      "Account Type",
      "Joined At",
      "Endless Levels Played",
      "Boxoban Medium",
      "Boxoban Hard",
      "Boxoban Unfiltered",
      "Total Boxoban Solved",
      "Vaults Played",
      "Vaults Created",
      "Total Levels Played",
    ];

    const row = [
      user.id,
      user.name,
      user.googleId,
      user.isAnonymous ? "Guest" : "Google",
      user.createdAt,
      user.endless,
      user.boxoban.medium,
      user.boxoban.hard,
      user.boxoban.unfiltered,
      totalBoxoban,
      user.vaults,
      user.totalVaultsCreated,
      totalLevels + user.vaults,
    ];

    const csvContent = [headers, row]
      .map((line) =>
        line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `user-${user.id}-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* User Profile Section */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-full bg-gray-100">
            <AvatarImage
              src={user.avatar || "/placeholder-user.svg"}
              alt={user.name}
            />
            <AvatarFallback className="bg-gray-200 text-gray-500 flex items-center justify-center h-full w-full">
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold text-black">{user.name}</h3>
            <p className="text-sm text-gray-700">{user.googleId}</p>

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
        </div>

        {/* Generate Report Button */}
        <PDFDownloadLink
          document={<SingleUserPDF user={user} />}
          fileName={`user-${user.id}-report.pdf`}
        >
          {({ loading }) => (
            <button
              disabled={loading}
              className="text-sm text-gray-700 px-2 py-2 rounded-md"
            >
              {loading ? "Generating..." : <Download />}
            </button>
          )}
        </PDFDownloadLink>
      </div>

      {/* Game Statistics */}
      <div className="flex flex-col gap-4">
        <h4 className="text-base font-semibold text-gray-900">
          Game Statistics
        </h4>

        {/* Endless Mode */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="flex items-center gap-2 pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium text-gray-800">
              <Zap className="h-5 w-5 text-yellow-500" />
              Endless Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {user.endless}
            </div>
            <p className="text-xs text-gray-500 mt-1">Levels completed</p>
          </CardContent>
        </Card>

        {/* Boxoban Mode */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="flex items-center gap-2 pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium text-gray-800">
              <GamepadIcon className="h-5 w-5 text-green-500" />
              Boxoban Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-2">
              <div className="flex flex-col items-center">
                <div className="text-xl font-bold text-gray-900">
                  {user.boxoban.medium}
                </div>
                <p className="text-xs text-gray-500">Medium</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-xl font-bold text-gray-900">
                  {user.boxoban.hard}
                </div>
                <p className="text-xs text-gray-500">Hard</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-xl font-bold text-gray-900">
                  {user.boxoban.unfiltered}
                </div>
                <p className="text-xs text-gray-500">Unfiltered</p>
              </div>
            </div>
            <div className="text-xs text-gray-600 text-center">
              Total: {totalBoxoban} levels solved
            </div>
          </CardContent>
        </Card>

        {/* Vault Mode Summary + Dialog Trigger */}
        {user.totalVaultsCreated > 0 && (
          <>
            <Card
              onClick={() => setIsDialogOpen(true)}
              className="bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition"
            >
              <CardHeader className="flex items-center gap-2 pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-medium text-gray-800">
                  <Shield className="h-5 w-5 text-purple-500" />
                  Vault Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center">
                    <div className="text-xl font-bold text-gray-900">
                      {user.totalVaultsCreated}
                    </div>
                    <p className="text-xs text-gray-500">Created</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-xl font-bold text-gray-900">
                      {user.vaults}
                    </div>
                    <p className="text-xs text-gray-500">Played</p>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">
                  Tap to view vault details
                </p>
              </CardContent>
            </Card>

            {/* Dialog showing list of vaults */}
            {/* Dialog showing list of vaults */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-h-[90vh] bg-white text-black overflow-y-auto scrollbar-hide">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">
                    Vaults Created by {user.name}
                  </DialogTitle>
                </DialogHeader>

                {user.vaultsCreatedWithPlays?.length > 0 ? (
                  <div className="flex flex-col gap-3 mt-2">
                    {user.vaultsCreatedWithPlays.map((vault) => (
                      <div
                        key={vault.id}
                        className="border border-gray-200 rounded-md p-3 bg-white"
                      >
                        <div className="font-medium">{vault.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Levels Played:{" "}
                          <span className="font-semibold text-black">
                            {vault.timesPlayed}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-4">No vaults found.</p>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
