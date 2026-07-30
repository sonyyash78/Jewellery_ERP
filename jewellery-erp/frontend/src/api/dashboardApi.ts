import { axiosClient } from './axiosClient';

export interface DashboardMetrics {
  today_sales: number;
  today_bills: number;
  today_purchases: number;
  today_profit: number;
  total_customers: number;
  inventory_value: number;
  low_stock_count: number;
}

export interface RecentActivity {
  recent_bills: any[];
  recent_purchases: any[];
}

export const getMetrics = async (): Promise<DashboardMetrics> => {
  const res = await axiosClient.get('/dashboard/metrics');
  return res.data;
};

export const getRecentActivity = async (): Promise<RecentActivity> => {
  const res = await axiosClient.get('/dashboard/recent-activity');
  return res.data;
};

export const getMetalRates = async () => {
  const res = await axiosClient.get('/metal-rates/latest');
  return res.data;
};
