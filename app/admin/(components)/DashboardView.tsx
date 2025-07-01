"use client";

import * as React from "react";
import { Users, BarChart3, Infinity, Target, Vault } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartTooltip } from "@/components/ui/chart";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import StatCard from "./StatCard";
import { toast } from "sonner";
import {
  fetchUsersDataCount,
  fetchUserSignupGraphDataAction,
} from "../actions";

export default function DashboardView() {
  const [activeTimeframe, setActiveTimeframe] = useState("Last Week");
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [endlessPlayed, setEndlessPlayed] = useState<number | null>(null);
  const [vaultPlayed, setVaultPlayed] = useState<number | null>(null);
  const [boxobanPlayed, setBoxobanPlayed] = useState<number | null>(null);
  const [userSignupData, setUserSignupData] = useState<
    { date: string; users: number }[]
  >([]);

  const filtered = filterUserSignupData(userSignupData, activeTimeframe);
  const totalSignups = filtered.reduce((sum, d) => sum + d.users, 0);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded shadow text-xs border border-gray-200">
          <div>
            <span className="font-semibold text-gray-700">Date: </span>
            <span className="text-gray-900">{label}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Signups: </span>
            <span className="text-blue-600">{payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  function filterUserSignupData(
    data: { date: string; users: number }[],
    timeframe: string
  ) {
    const now = new Date();
    let filtered: { date: string; users: number }[] = [];
    if (timeframe === "Today") {
      const today = new Date().toLocaleDateString("en-CA"); // local YYYY-MM-DD
      filtered = data.filter((d) => d.date === today);
    } else if (timeframe === "Last Week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 6);
      filtered = data.filter((d) => new Date(d.date) >= weekAgo);
    } else if (timeframe === "Last Month") {
      const monthAgo = new Date(now);
      monthAgo.setDate(now.getDate() - 29);
      filtered = data.filter((d) => new Date(d.date) >= monthAgo);
    } else {
      filtered = data;
    }

    if (filtered.length === 0 || (filtered[0] && filtered[0].users !== 0)) {
      filtered.unshift({
        date: now.toISOString().slice(0, 10),
        users: 0,
      });
    }

    return filtered;
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetchUsersDataCount();
        const signups = await fetchUserSignupGraphDataAction();

        setTotalUsers(res?.totalUsers ?? 0);
        setEndlessPlayed(res?.endlessPlayed ?? 0);
        setVaultPlayed(res?.vaultPlayed ?? 0);
        setBoxobanPlayed(res?.boxobanPlayed ?? 0);

        setUserSignupData(
          signups.map(({ date, count }) => ({ date, users: count }))
        );
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        toast.error("Failed to load dashboard statistics. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 min-h-screen">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-400 text-sm m-0">
            Welcome back! Here&apos;s what&apos;s happening with your game.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={loading ? "Loading..." : totalUsers?.toLocaleString() ?? "0"}
          icon={<Users />}
        />
        <StatCard
          title="Total Endless Levels Played"
          value={endlessPlayed ?? "Loading..."}
          icon={<Infinity />}
        />
        <StatCard
          title="Total Spike Vault Levels Played"
          value={vaultPlayed ?? "Loading..."}
          icon={<Vault />}
        />
        <StatCard
          title="Boxoban Levels Played"
          value={boxobanPlayed ?? "Loading..."}
          icon={<Target />}
        />
      </div>

      {/* Analytics Section */}
      <div className="w-full px-4 md:px-6 lg:px-8">
        <div className="grid gap-4 grid-cols-1">
          <Card className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardHeader className="p-4 border-b border-gray-100">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <BarChart3 className="h-5 w-5" />
                    User Analytics
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-sm mt-1">
                    Website user signup overview
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                  {["Today", "Last Week", "Last Month", "Total"].map(
                    (timeframe) => (
                      <Button
                        disabled={loading}
                        key={timeframe}
                        size="sm"
                        onClick={() => setActiveTimeframe(timeframe)}
                        className={`
                  text-xs px-3 py-1 rounded border transition-all
                  ${
                    activeTimeframe === timeframe
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }
                `}
                      >
                        {timeframe}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pl-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-[350px]">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
                  <span className="text-gray-500">Loading ...</span>
                </div>
              ) : (
                <>
                  <div className="w-full">
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart
                        data={filtered}
                        margin={{ left: 12, right: 12 }}
                      >
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => value.slice(5)} // MM-DD
                        />
                        <YAxis allowDecimals={false} />
                        <ChartTooltip
                          cursor={false}
                          content={<CustomTooltip />}
                        />

                        {filtered[19]?.date && (
                          <ReferenceLine
                            x={filtered[19].date}
                            stroke="#ef4444"
                            strokeDasharray="3 3"
                            label={{
                              value: `#20`,
                              position: "top",
                              fill: "#ef4444",
                              fontSize: 12,
                              fontWeight: "bold",
                            }}
                          />
                        )}

                        <Line
                          dataKey="users"
                          type="monotone"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 flex flex-col border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {activeTimeframe === "Today"
                          ? "Today's Signups"
                          : activeTimeframe === "Last Week"
                          ? "Signups (Last 7 days)"
                          : activeTimeframe === "Last Month"
                          ? "Signups (Last 30 days)"
                          : "Total Signups"}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {String(totalSignups)
                          .split("")
                          .reduce((sum, digit) => sum + Number(digit), 0)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {filtered.length === 1
                        ? `Date: ${filtered[0]?.date}`
                        : filtered.length > 1
                        ? `From: ${filtered[0]?.date} To: ${
                            filtered[filtered.length - 1]?.date
                          }`
                        : ""}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
