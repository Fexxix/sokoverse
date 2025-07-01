"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  fetchTimeSeriesData,
  fetchTopBrowsers,
  fetchTopPages,
  fetchWebsiteAnalytics,
} from "../actions";
import AnalyticsCard from "./AnalyticsCard";
import {
  BarChart2,
  Clock,
  Eye,
  MousePointerClick,
  TrendingUp,
  Zap,
} from "lucide-react";
import { AnalyticsData, TopPage, VisitorDetail } from "../queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

const websitePaths = [
  "/",
  "/terminal",
  "/endless",
  "/spike-vaults",
  "/boxoban",
  "/endless/play",
  "/boxoban/play",
  "/spike-vaults/play",
];
const timeRanges = [
  { label: "Today", value: "day" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "All", value: "all" },
];

// Utility function to format visit duration
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

// Utility function to get time range label
function getTimeRangeLabel(value: string): string {
  const range = timeRanges.find((r) => r.value === value);
  return range ? range.label : "All Time";
}

function useFetch<T>(fetchFn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const result = await fetchFn();
        if (active) setData(result);
      } catch (err: unknown) {
        if (active) setError((err as Error).message || "Error");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, deps);

  return { data, loading, error };
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("all");

  const { data: analytics, loading: loadingAnalytics } =
    useFetch<AnalyticsData>(
      () => fetchWebsiteAnalytics(dateRange),
      [dateRange]
    );

  const {
    data: topPages,
    loading: loadingPages,
    error: errorPages,
  } = useFetch<TopPage[]>(() => fetchTopPages(dateRange), [dateRange]);

  const {
    data: browsers,
    loading: loadingBrowsers,
    error: errorBrowsers,
  } = useFetch<VisitorDetail[]>(() => fetchTopBrowsers(dateRange), [dateRange]);

  const { data: timeSeriesData, loading: timeSeriesLoading } = useFetch(
    () => fetchTimeSeriesData(dateRange),
    [dateRange]
  );

  return (
    <div className="p-6 bg-white min-h-screen text-gray-800">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Website Analytics Overview</h2>
        <Select
          disabled={loadingAnalytics || loadingPages || loadingBrowsers}
          value={dateRange}
          onValueChange={setDateRange}
        >
          <SelectTrigger className="w-[180px] bg-white text-black">
            <SelectValue placeholder="Select Time Range" />
          </SelectTrigger>
          <SelectContent className="bg-white text-black">
            {timeRanges.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <AnalyticsCard
          label="Unique Visitors"
          value={loadingAnalytics ? "loading" : analytics?.visitors ?? 0}
          icon={<BarChart2 />}
          color="blue"
        />

        <AnalyticsCard
          label="Pageviews"
          value={loadingAnalytics ? "loading" : analytics?.pageviews ?? 0}
          icon={<Eye />}
          color="green"
        />

        <AnalyticsCard
          label="Visits"
          value={loadingAnalytics ? "loading" : analytics?.visits ?? 0}
          icon={<MousePointerClick />}
          color="orange"
        />

        <AnalyticsCard
          label="Views per Visit"
          value={
            loadingAnalytics
              ? "loading"
              : (analytics?.views_per_visit ?? 0).toFixed(1)
          }
          icon={<TrendingUp />}
          color="purple"
        />

        <AnalyticsCard
          label="Bounce Rate"
          value={
            loadingAnalytics
              ? "loading"
              : `${(analytics?.bounce_rate ?? 0).toFixed(1)}%`
          }
          icon={<Zap />}
          color="gray"
        />

        <AnalyticsCard
          label="Visit Duration"
          value={
            loadingAnalytics
              ? "loading"
              : formatDuration(analytics?.visit_duration ?? 0)
          }
          icon={<Clock className="w-5 h-5" />}
          color="yellow"
        />
      </div>

      {/* Line Chart */}
      <Card className="mb-8 bg-white dark:bg-white text-black">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Website Traffic - {getTimeRangeLabel(dateRange)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeSeriesLoading || !timeSeriesData?.length ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4 bg-gray-200" />
              <Skeleton className="h-[300px] w-full bg-gray-200" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    try {
                      return format(
                        new Date(value),
                        dateRange === "day" ? "HH:mm" : "MMM dd"
                      );
                    } catch {
                      return value;
                    }
                  }}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => {
                    try {
                      return format(
                        new Date(value),
                        dateRange === "day" ? "HH:mm" : "MMM dd, yyyy"
                      );
                    } catch {
                      return value;
                    }
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="#60a5fa"
                  name="Visitors"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="pageviews"
                  stroke="#4ade80"
                  name="Pageviews"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="visits"
                  stroke="#fbbf24"
                  name="Visits"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Pages + Visitor Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
        {/* Top Pages */}
        <Card className="bg-white text-black">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPages ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24 bg-gray-200" />
                    <Skeleton className="h-4 w-12 bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : errorPages ? (
              <p className="text-red-500 text-sm">{errorPages}</p>
            ) : (
              <div className="space-y-3">
                {topPages
                  ?.filter((page) => websitePaths.includes(page.page))
                  .slice(0, 8)
                  .map((page) => (
                    <div
                      key={page.page}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-700  truncate flex-1 mr-2">
                        {page.page === "/" ? "Home" : page.page}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {page.pageviews.toLocaleString()}
                      </span>
                    </div>
                  ))}
                {(!topPages ||
                  topPages.filter((page) => websitePaths.includes(page.page))
                    .length === 0) && (
                  <p className="text-gray-500 text-sm">
                    No page data available
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visitor Details */}
        <Card className="bg-white text-black">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Visitor Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBrowsers ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2 border-b pb-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-16 bg-gray-200" />
                      <Skeleton className="h-3 w-20 bg-gray-200" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-12 bg-gray-200" />
                      <Skeleton className="h-3 w-16 bg-gray-200" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-8 bg-gray-200" />
                      <Skeleton className="h-3 w-24 bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : errorBrowsers ? (
              <p className="text-red-500 text-sm">{errorBrowsers}</p>
            ) : (
              <div className="space-y-4">
                {browsers?.slice(0, 4).map((visitor, index) => (
                  <div
                    key={index}
                    className="space-y-2 text-sm border-b pb-3 last:border-b-0"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">
                        Browser:
                      </span>
                      <span className="text-gray-900">{visitor.browser}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Device:</span>
                      <span className="text-gray-900">{visitor.device}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">OS:</span>
                      <span className="text-gray-900">{visitor.os}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">
                        Referrer:
                      </span>
                      <span
                        className="text-gray-900 truncate max-w-32"
                        title={visitor.referrer}
                      >
                        {visitor.referrer === "Direct / None"
                          ? "Direct"
                          : visitor.referrer}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">
                        Pageviews:
                      </span>
                      <span className="font-semibold text-gray-900">
                        {visitor.pageviews.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                {(!browsers || browsers.length === 0) && (
                  <p className="text-gray-500 text-sm">
                    No visitor data available
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
