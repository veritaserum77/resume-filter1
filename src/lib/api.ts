const BASE_URL = "https://backend-f2yv.onrender.com";

// Type definitions
interface JDPayload {
  job_title: string;
  job_description: string;
  skills: Record<string, number>;
}

interface JDResponse {
  message: string;
  jd_id?: string;
}

interface JDSingleResponse extends JDPayload {
  jd_id: string;
  created_at: string;
}

interface JDHistoryResponse {
  history: JDSingleResponse[];
}

interface AuthResponse {
  access_token: string;
  user_id: string;
  name: string;
}

// Utility: Safe error parser
async function safeParseError(res: Response): Promise<string> {
  try {
    const err = await res.json();
    return err.detail || err.message || JSON.stringify(err);
  } catch {
    return res.statusText || "Unknown error occurred";
  }
}

// Utility: Generic fetch wrapper
async function authenticatedFetch<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await safeParseError(res);
    throw new Error(error);
  }

  return res.json() as Promise<T>;
}

// Auth Services
export const authService = {
  async signupInit(name: string, email: string, password: string) {
    return authenticatedFetch<{ message: string }>("/auth/signup/init", "", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  async verifySignup(email: string, otp: string) {
    return authenticatedFetch<{ message: string }>("/auth/signup/verify", "", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },

  async login(email: string, password: string) {
    return authenticatedFetch<AuthResponse>("/auth/login", "", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async getProfile(token: string) {
    return authenticatedFetch<{ user_id: string; name: string; email: string }>(
      "/auth/me",
      token
    );
  },
};

// JD Services
export const jdService = {
  async submitJD(token: string, jdPayload: JDPayload) {
    return authenticatedFetch<JDResponse>("/jd/submit", token, {
      method: "POST",
      body: JSON.stringify(jdPayload),
    });
  },

  async getJD(token: string, jdId: string) {
    return authenticatedFetch<JDSingleResponse>(`/jd/${jdId}`, token);
  },

  async getJDHistory(token: string, skip: number = 0, limit: number = 10) {
    return authenticatedFetch<JDHistoryResponse>(
      `/jd/history?skip=${skip}&limit=${limit}`,
      token
    );
  },

  async updateJD(token: string, jdId: string, updatedData: JDPayload) {
    return authenticatedFetch<JDResponse>(`/jd/update/${jdId}`, token, {
      method: "PUT",
      body: JSON.stringify(updatedData),
    });
  },

  async deleteJD(token: string, jdId: string) {
    return authenticatedFetch<JDResponse>(`/jd/delete/${jdId}`, token, {
      method: "DELETE",
    });
  },
};

// Utility function for handling API errors in components
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}
