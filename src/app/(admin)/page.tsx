"use client";
import React, { useEffect, useState } from "react";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import MonthlyWasteChart from "@/components/dashboard/MonthlyWasteChart";
import RecentActivities from "@/components/dashboard/RecentActivities";
import dashboardService from "@/services/dashboardService";

export default function Ecommerce() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    suppliers: 0,
    gestores: 0,
    carriers: 0,
    diTotal: 0,
    totalWasteTonnes: "0.00",
  });
  const [monthlyData, setMonthlyData] = useState<{ name: string; value: number }[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsData, monthlyWaste, recentActivities] = await Promise.all([
          dashboardService.getDashboardStats(),
          dashboardService.getMonthlyWasteData(),
          dashboardService.getRecentActivity(),
        ]);

        setStats(statsData);
        setMonthlyData(monthlyWaste);
        setActivities(recentActivities);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardMetrics stats={stats} />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-8">
          <MonthlyWasteChart data={monthlyData} />
        </div>

        <div className="col-span-12 xl:col-span-4">
          <RecentActivities activities={activities} />
        </div>

        {/* Podríamos añadir más secciones aquí en el futuro como un mapa o alertas SIRA */}
      </div>
    </div>
  );
}
