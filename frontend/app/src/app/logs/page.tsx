"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import LogPanel from "@/components/LogPanel";
import { LogsConfig } from "@/types/integration";
import { getIntegrations, getPipelineLogs } from "@/utils/api";
import { capitalizeFirstLetter } from "@/utils/func";
import { useEffect, useState } from "react";

const log_tabs = ["scheduler", "celery", "api"];

const Logs = () => {
  const [activeTab, setActiveTab] = useState("scheduler");
  const [integrations, setIntegrations] = useState();

  useEffect(() => {
    const loadIntegrations = async () => {
      const res = await getIntegrations();
      setIntegrations(res);
    };
    loadIntegrations();
  }, []);

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Logging" />

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-300">
        {log_tabs.map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab.toLowerCase().replace(/ /g, "")
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab(tab.toLowerCase().replace(/ /g, ""))}
          >
            {capitalizeFirstLetter(tab)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "scheduler" && <SchedulerLogs />}
      {activeTab === "celery" && <CeleryLogs />}
      {activeTab === "api" && <ApiLogs integrations={integrations} />}
    </DefaultLayout>
  );
};

const SchedulerLogs = () => {
  const [logsData, setLogsData] = useState<LogsConfig>();
  const [isLoading, setIsloading] = useState(false);

  useEffect(() => {
    const loadLogs = async () => {
      setIsloading(true);
      const params = {
        logs_type: "scheduler",
        per_page: 1000,
        page: 1,
      };
      const res = await getPipelineLogs(params);
      setLogsData(res);
      setIsloading(false);
    };

    loadLogs();
  }, []);

  return (
    <LogPanel
      title="Scheduler Logs"
      logsData={logsData}
      isLoading={isLoading}
    />
  );
};

const CeleryLogs = () => {
  const [logs, setLogs] = useState<LogsConfig>();
  const [isLoading, setIsloading] = useState(false);

  useEffect(() => {
    const loadLogs = async () => {
      setIsloading(true);
      const params = {
        logs_type: "celery",
        per_page: 1000,
        page: 1,
      };
      const res = await getPipelineLogs(params);
      setLogs(res);
      setIsloading(false);
    };

    loadLogs();
  }, []);
  return <LogPanel title="Celery Logs" logsData={logs} isLoading={isLoading} />;
};

const ApiLogs = (params: any) => {
  const { integrations } = params;
  const [logs, setLogs] = useState<LogsConfig>();
  const [integration, setIntegration] = useState("-");
  const [isLoading, setIsloading] = useState(false);

  useEffect(() => {
    const loadLogs = async () => {
      setIsloading(true);
      const params = {
        integration_id: integration,
        logs_type: "api",
        per_page: 1000,
        page: 1,
      };
      const res = await getPipelineLogs(params);
      setLogs(res);
      setIsloading(false);
    };

    if (integration !== "-") {
      loadLogs();
    }
  }, [integration]);

  return (
    <div className="space-y-6">
      <h2 className="mb-4 text-lg font-semibold">Select Integration</h2>
      <div>
        <label htmlFor="integration">Integration Name</label>
        <select
          name="integration"
          id="integration"
          value={integration}
          onChange={(e) => setIntegration(e.target.value)}
          className="w-full rounded-sm bg-whiten p-2 text-black focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="-">----</option>
          {integrations?.data.map((pipeline: any) => (
            <option value={pipeline.id}>{pipeline.integration_name}</option>
          ))}
        </select>
      </div>
      <LogPanel
        title="Integration Logs"
        logsData={logs}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Logs;