import {
  ParamMetadata,
  ParamUpdateConnection,
  StoreConnectionsParam,
  TestConnection,
} from "@/types/connectors";
import {
  IntegrationConfig,
  LogsParam,
  ParamUpdateIntegration,
} from "@/types/integration";
import axios, { AxiosRequestConfig, Canceler } from "axios";
import cacheData from "memory-cache";

// Define the base URL globally for reuse
export const base_url = process.env.NEXT_PUBLIC_API_URL;

// Map to track pending requests
const pendingRequests = new Map<string, Canceler>();

// Generic API handler with memory cache
const apiRequest = async (
  method: "get" | "post" | "put" | "delete",
  endpoint: string,
  data?: object,
  cacheDurationInMs?: number, // Optional cache duration in milliseconds
) => {
  const url = `${base_url}${endpoint}`;
  const requestKey = `${method.toUpperCase()}::${url}`;

  // Handle cached data
  if (method === "get" && cacheDurationInMs) {
    const cachedResponse = cacheData.get(requestKey);
    if (cachedResponse) {
      console.log(`Cache hit for: ${requestKey}`);
      return cachedResponse;
    }
  }

  // Cancel any previous request with the same key
  if (pendingRequests.has(requestKey)) {
    const cancel = pendingRequests.get(requestKey);
    cancel?.("Request canceled due to a new request with the same key.");
    pendingRequests.delete(requestKey);
  }

  // Create a CancelToken
  const cancelToken = new axios.CancelToken((canceler) => {
    pendingRequests.set(requestKey, canceler);
  });

  try {
    const config: AxiosRequestConfig = {
      method,
      url,
      ...(data && { data }),
      cancelToken,
    };

    const response = await axios(config);

    // Remove the request key after a successful response
    pendingRequests.delete(requestKey);

    // Cache the response for GET requests if caching is enabled
    if (method === "get" && cacheDurationInMs) {
      console.log(`Caching response for: ${requestKey}`);
      cacheData.put(requestKey, response.data, cacheDurationInMs);
    }

    return response.data;
  } catch (error: any) {
    // Remove the request key on error
    pendingRequests.delete(requestKey);

    if (axios.isCancel(error)) {
      console.warn(`Request canceled: ${requestKey}`, error.message);
      throw new Error("Request was canceled.");
    }

    console.error(
      `Error in API request: ${method.toUpperCase()} ${endpoint}`,
      error.message,
    );
    throw new Error(
      error.response?.data?.message ||
        `Error occurred during ${method.toUpperCase()} ${endpoint}`,
    );
  }
};

// GET
export const fetchDashboardData = async () => {
  return apiRequest(
    "get",
    "/database/get_dashboard_data",
    undefined,
    5 * 60 * 1000,
  );
};
export const fetchInstalledConnectors = async () => {
  return apiRequest(
    "get",
    "/connector/get_installed_connectors",
    undefined,
    5 * 60 * 1000,
  );
};
export const getConnectorAuthDetails = async (name: string, type: string) => {
  return apiRequest(
    "get",
    `/connector/get_connector_auth_details/${name}/${type}`,
    undefined,
    5 * 60 * 1000,
  );
};
export const getIntegrations = async (page?: number) => {
  return apiRequest(
    "get",
    `/pipeline/get_integrations?page=${page}`,
    undefined,
    5 * 60 * 1000,
  );
};
export const getIntegrationHistory = async (id: string, page: number) => {
  return apiRequest(
    "get",
    `/pipeline/get_integration_history/${id}?page=${page}`,
  );
};
export const getPipelineLogs = async (params: LogsParam) => {
  return apiRequest(
    "get",
    `/pipeline/get_logs?${params.integration_id ? `integration_id=${params.integration_id}&logs_type=${params.logs_type}` : `logs_type=${params.logs_type}`}&page=${params.page}&per_page=${params.per_page}`,
    undefined,
    5 * 60 * 1000,
  );
};
export const getSchedulerListJobs = async () => {
  return apiRequest("get", "/scheduler/list-jobs", undefined, 5 * 60 * 1000);
};
export const getCeleryTasks = async () => {
  return apiRequest("get", "/worker/tasks", undefined, 5 * 60 * 1000);
};

// POST
export const fetchCreatedConnections = async (type: string) => {
  return apiRequest("post", "/connector/get_created_connections", {
    connector_type: type,
  });
};
export const test_connection = async (params: TestConnection) => {
  return apiRequest("post", "/connector/test_connection", {
    ...params,
  });
};
export const store_connection = async (params: StoreConnectionsParam) => {
  return apiRequest("post", "/connector/store_connection", {
    ...params,
  });
};
export const fetch_metadata = async (params: ParamMetadata) => {
  return apiRequest("post", "/connector/fetch_metadata", {
    ...params,
  });
};
export const create_integration = async (params: IntegrationConfig) => {
  return apiRequest("post", "/pipeline/create_integration", {
    ...params,
  });
};

// DELETE
export const delete_connection = async (id: number) => {
  return apiRequest(
    "delete",
    `/connector/delete_connection/?document_id=${id}`,
  );
};

// UPDATE
export const update_connection = async (params: ParamUpdateConnection) => {
  return apiRequest("post", "/connector/update_connection", params);
};
export const update_integration = async (params: ParamUpdateIntegration) => {
  return apiRequest("post", "/pipeline/update_integration", params);
};
