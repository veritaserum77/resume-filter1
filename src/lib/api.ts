const BASE_URL = "https://backend-f2yv.onrender.com";

// ✅ Signup - sends OTP
export async function signupInit(name: string, email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/signup/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    const error = await safeParseError(res);
    throw new Error(error || "Signup failed");
  }

  return res.json(); // { message: "...", etc }
}

// ✅ Verify OTP and complete signup
export async function verifySignup(email: string, otp: string) {
  const res = await fetch(`${BASE_URL}/auth/signup/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp }),
  });

  if (!res.ok) {
    const error = await safeParseError(res);
    throw new Error(error || "OTP verification failed");
  }

  return res.json(); // { message: "...", etc }
}

// ✅ Login
export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await safeParseError(res);
    throw new Error(error || "Login failed");
  }

  return res.json(); // { access_token, user_id, name }
}

// ✅ Submit a JD (Authenticated)
export async function submitJD(token: string, jdPayload: { job_title: string, job_description: string, skills: Record<string, number> }) {
  const res = await fetch(`${BASE_URL}/jd/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(jdPayload),
  });

  if (!res.ok) {
    const error = await safeParseError(res);
    throw new Error(error || "JD submission failed");
  }

  return res.json(); // { message, jd_id }
}

// ✅ Save JD as Draft (Authenticated)
export async function saveJDDraft(token: string, jdPayload: { job_title: string, job_description: string, skills: Record<string, number> }) {
  const res = await fetch(`${BASE_URL}/jd/draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(jdPayload),
  });

  if (!res.ok) {
    const error = await safeParseError(res);
    throw new Error(error || "Saving draft failed");
  }

  return res.json(); // { message, jd_id }
}

// ✅ Fetch JD history (Authenticated)
export async function getJDHistory(token: string) {
  const res = await fetch(`${BASE_URL}/jd/history`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await safeParseError(res);
    throw new Error(error || "Failed to fetch JD history");
  }

  return res.json(); // { history: [...] }
}

// 🔒 Utility: Safe error parser
async function safeParseError(res: Response) {
  try {
    const err = await res.json();
    return err.detail || JSON.stringify(err);
  } catch {
    return res.statusText;
  }
}
