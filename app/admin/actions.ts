// app/actions/adminStats.action.ts

"use server";
import { UserType } from "./(components)/UsersPage";
import {
  AnalyticsData,
  fetchUserSignupsGroupedByDate,
  FilterOptions,
  getFilteredUsers,
  getTimeSeriesData,
  getTopPages,
  getUsersDataCountQuery,
  getVisitorDetails,
  getWebsiteAnalyticsData,
  TopPage,
  VisitorDetail,
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

export async function fetchWebsiteAnalytics(
  dateRange: string | [string, string]
): Promise<AnalyticsData> {
  try {
    const analytics = await getWebsiteAnalyticsData(dateRange);

    return analytics;
  } catch (error) {
    console.error("Error loading Plausible Analytics:", error);
    return {
      visitors: 0,
      pageviews: 0,
      visits: 0,
      views_per_visit: 0,
      bounce_rate: 0,
      visit_duration: 0,
    };
  }
}

export async function fetchTopPages(
  dateRange: string | [string, string]
): Promise<TopPage[]> {
  try {
    const pages = await getTopPages(dateRange); // you can pass "7d", "30d", etc.
    return pages;
  } catch (error) {
    console.error("Error fetching top pages:", error);
    return []; // Fallback: return empty list on failure
  }
}

export async function fetchTopBrowsers(
  dateRange: string | [string, string]
): Promise<VisitorDetail[]> {
  try {
    const data = await getVisitorDetails(dateRange); // correctly calling getTopBrowsers here
    return data;
  } catch (error) {
    console.error("Error fetching top browsers:", error);
    return []; // fallback in case of error
  }
}

type TimeSeriesPoint = {
  date: string;
  visitors: number;
  pageviews: number;
  visits: number;
  bounce_rate: number;
};

export async function fetchTimeSeriesData(
  dateRange: string | [string, string]
): Promise<TimeSeriesPoint[]> {
  try {
    const data = await getTimeSeriesData(dateRange);
    const labels: string[] = data.meta?.time_labels ?? [];
    const results = data.results ?? [];

    const resultMap: Record<string, TimeSeriesPoint> = {};

    for (const item of results) {
      const [date] = item?.dimensions ?? [];
      const [visitors = 0, pageviews = 0, visits = 0, bounce_rate = 0] =
        item?.metrics ?? [];

      if (date) {
        resultMap[date] = {
          date,
          visitors,
          pageviews,
          visits,
          bounce_rate,
        };
      }
    }

    const completeData: TimeSeriesPoint[] = labels.map((date) => ({
      date,
      visitors: resultMap[date]?.visitors ?? 0,
      pageviews: resultMap[date]?.pageviews ?? 0,
      visits: resultMap[date]?.visits ?? 0,
      bounce_rate: resultMap[date]?.bounce_rate ?? 0,
    }));

    return completeData;
  } catch (error) {
    console.error("Error fetching time series data:", error);
    return [];
  }
}
