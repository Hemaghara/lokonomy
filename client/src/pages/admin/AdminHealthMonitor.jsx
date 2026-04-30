import React, { useState, useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiActivity,
  FiServer,
  FiDatabase,
  FiCpu,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";

const AdminHealthMonitor = () => {
  const [status, setStatus] = useState({
    api: "checking",
    database: "checking",
    redis: "checking",
    cpu: 0,
    memory: 0,
    uptime: "0d 0h 0m",
  });
  const [errors, setErrors] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = async () => {
    setIsRefreshing(true);
    try {
      const response = await adminService.getHealthStatus();
      const data = response.data;

      setStatus({
        api: data.api,
        database: data.database,
        redis: data.redis,
        cpu: data.cpu,
        memory: data.memory,
        uptime: data.uptime,
      });
      setErrors([
        {
          id: 1,
          type: "Warning",
          message: `Primary DB Latency: ${data.dbPing}ms`,
          time: "Just now",
        },
      ]);

      toast.success("Health status updated");
    } catch (err) {
      toast.error("Failed to check system health");
      setStatus((prev) => ({
        ...prev,
        api: "down",
        database: "down",
      }));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatusIndicator = ({ type }) => {
    if (type === "healthy")
      return (
        <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-widest">
          <FiCheckCircle /> Healthy
        </span>
      );
    if (type === "checking")
      return (
        <span className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-widest animate-pulse">
          <FiRefreshCw className="animate-spin" /> Checking
        </span>
      );
    return (
      <span className="flex items-center gap-1.5 text-rose-400 font-bold text-xs uppercase tracking-widest">
        <FiAlertCircle /> Down
      </span>
    );
  };

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            System <span className="text-indigo-500">Health</span> Monitor
          </h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
            Infrastructure & error tracking hub
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
        >
          <FiRefreshCw className={isRefreshing ? "animate-spin" : ""} />
          <span className="text-xs font-black uppercase tracking-wider">
            Refresh Diagnostics
          </span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          {
            label: "API Cluster",
            icon: FiServer,
            status: status.api,
            color: "indigo",
          },
          {
            label: "Primary DB",
            icon: FiDatabase,
            status: status.database,
            color: "emerald",
          },
          {
            label: "Cache Engine",
            icon: FiActivity,
            status: status.redis,
            color: "rose",
          },
          {
            label: "Security Layer",
            icon: FiShield,
            status: "healthy",
            color: "sky",
          },
        ].map((item, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
            className="bg-slate-900/60 border border-slate-800 p-6 rounded-[28px] backdrop-blur-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                <item.icon className="text-slate-400" />
              </div>
              <StatusIndicator type={item.status} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              {item.label}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <ChartCard title="Resource Usage">
            <div className="space-y-6">
              {[
                {
                  label: "CPU Utilization",
                  value: status.cpu,
                  color: "bg-indigo-500",
                },
                {
                  label: "Memory Usage",
                  value: status.memory,
                  color: "bg-emerald-500",
                },
              ].map((res, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {res.label}
                    </span>
                    <span className="text-sm font-black text-white">
                      {res.value}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${res.value}%` }}
                      className={`h-full ${res.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="System Performance">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-rose-400">
                <FiClock size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Total Uptime
                </p>
                <p className="text-xl font-black text-white">{status.uptime}</p>
              </div>
            </div>
          </ChartCard>
        </div>

        <div className="lg:col-span-2">
          <ChartCard title="Recent Incident Logs">
            <div className="divide-y divide-white/5">
              {errors.map((err) => (
                <div key={err.id} className="py-4 flex gap-4">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${err.type === "Error" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"}`}
                  >
                    <FiAlertCircle />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {err.type}
                      </p>
                      <span className="text-[10px] font-bold text-slate-600">
                        {err.time}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {err.message}
                    </p>
                  </div>
                </div>
              ))}
              {errors.length === 0 && (
                <div className="py-10 text-center text-slate-600 font-bold uppercase tracking-widest">
                  No incidents reported in the last 24h
                </div>
              )}
            </div>
            <button className="w-full mt-6 py-3 border border-dashed border-slate-700 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]">
              View Full Logs Hub
            </button>
          </ChartCard>
        </div>
      </div>
    </AdminLayout>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="bg-slate-900/60 border border-slate-800 p-7 rounded-4xl backdrop-blur-md shadow-2xl">
    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-7">
      {title}
    </h3>
    {children}
  </div>
);

export default AdminHealthMonitor;
