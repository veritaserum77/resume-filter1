const BASE_URL = "https://backend-f2yv.onrender.com";

// ✅ Signup - sends OTP
export async function signupInit(name, email, password) {
  const res = await fetch(`${BASE_URL}/auth/signup/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Signup failed");
  }

  return res.json(); // { message: "...", etc }
}

// ✅ Verify OTP and complete signup
export async function verifySignup(email, otp) {
  const res = await fetch(`${BASE_URL}/auth/signup/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "OTP verification failed");
  }

  return res.json();
}

// ✅ Login
export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Login failed");
  }

  return res.json(); // { access_token, user_id, name }
}

// ✅ Submit a JD
export async function submitJD(token, jdPayload) {
  const res = await fetch(`${BASE_URL}/jd/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(jdPayload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "JD submission failed");
  }

  return res.json(); // { message, jd_id }
}

// ✅ Get JD History
export async function getJDHistory(token) {
  const res = await fetch(`${BASE_URL}/jd/history`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to fetch JD history");
  }

  return res.json(); // { history: [...] }
}
