import { deepTrim } from "@repo/shared";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
import axios, { isAxiosError } from "axios";
import { envConfig } from "@/config";

export class ApiClient {
	static async request<T>(config: AxiosRequestConfig): Promise<T> {
		try {
			const isFormData = config.data instanceof FormData;

			if (config.data && !isFormData) {
				config.data = deepTrim(config.data);
			}
			if (config.params) {
				config.params = deepTrim(config.params);
			}

			const client = axios.create({
				baseURL: envConfig.apiUrl,
				withCredentials: config.withCredentials ?? true,
				headers: {
					...(config.data && !isFormData
						? { "Content-Type": "application/json" }
						: {}),
				},
			});
			const response: AxiosResponse<T> = await client.request(config);
			return response.data;
		} catch (err) {
			if (isAxiosError(err)) {
				throw new Error(err.response?.data.message || "Something went wrong");
			}
			console.log(err);
			throw new Error("Something went wrong");
		}
	}

	static async get<T>(
		url: string,
		params?: Record<string, unknown>,
	): Promise<T> {
		return ApiClient.request<T>({ method: "GET", url, params });
	}

	static async post<T, D = unknown>(url: string, data?: D): Promise<T> {
		return ApiClient.request<T>({ method: "POST", url, data });
	}

	static async put<T, D = unknown>(url: string, data?: D): Promise<T> {
		return ApiClient.request<T>({ method: "PUT", url, data });
	}

	static async patch<T, D = unknown>(url: string, data?: D): Promise<T> {
		return ApiClient.request<T>({ method: "PATCH", url, data });
	}

	static async delete<T>(
		url: string,
		params?: Record<string, unknown>,
	): Promise<T> {
		return ApiClient.request<T>({ method: "DELETE", url, params });
	}
}
