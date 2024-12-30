import { LogsConfig } from "@/types/integration";
import { useEffect, useRef } from "react";
import Spinner from "../common/Spinner";

interface LogPanelInterface {
  title: string;
  logsData: LogsConfig | undefined;
  isLoading: boolean;
}

const LogPanel = (params: LogPanelInterface) => {
  const { title, logsData, isLoading } = params;

  return (
    <div className="mx-auto rounded-lg bg-white p-4 text-black shadow-md dark:bg-boxdark dark:text-white">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      <div className="h-[50vh] overflow-y-auto rounded-lg bg-gray-300 p-4 dark:bg-gray-800">
        {logsData && logsData.logs.length > 0 ? (
          logsData.logs.map((log, index) => (
            <div
              key={index}
              className="mb-2 break-all rounded-md bg-gray-100 p-2 text-sm dark:bg-gray-700"
            >
              {log}
            </div>
          ))
        ) : (
          <p className="text-gray-400">No logs available.</p>
        )}
        <Spinner visible={isLoading} />
      </div>
    </div>
  );
};

export default LogPanel;
