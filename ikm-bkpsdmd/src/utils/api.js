import { useAuth } from "../contexts/AuthContext";

/**
 * Catatan:
 * - Jangan ada export function submitResponse() di top-level yang kosong.
 * - Semua request write mengirim 'Accept: application/json'.
 */

export function useApi() {
  const { API, authFetch } = useAuth();
  const withBase = (p) => `${API || ""}${p}`;

  // Helper header untuk request JSON
  const jsonHeaders = (headers = {}) => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    ...headers,
  });

  // ---------------------------
  // PUBLIC
  // ---------------------------
  const getActiveSurvey = async (opts = {}) => {
    if (!API) throw new Error("API base URL belum di-set (VITE_API_URL).");
    const { year, semester, signal } = opts || {};
    const q = new URLSearchParams();
    if (year) q.set("year", year);
    if (semester) q.set("semester", semester);

    const res = await fetch(
      withBase(`/public/surveys/active${q.toString() ? `?${q}` : ""}`),
      { signal }
    );
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  // NOTE: kalau surveyId ada, JANGAN kirim year/semester ——> biar tidak retrigger/ganda
  const getAnalytics = async (opts = {}) => {
    if (!API) throw new Error("API base URL belum di-set (VITE_API_URL).");
    const { surveyId, year, semester, signal } = opts || {};
    const q = new URLSearchParams();
    if (surveyId) {
      q.set("survey_id", surveyId);
    } else {
      if (year) q.set("year", year);
      if (semester) q.set("semester", semester);
    }

    const res = await fetch(withBase(`/public/analytics?${q.toString()}`), {
      signal,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  // Kirim jawaban kuesioner
  const submitResponse = async (payload, { signal } = {}) => {
    if (!API) throw new Error("API base URL belum di-set (VITE_API_URL).");
    const res = await fetch(withBase(`/public/responses`), {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
      signal,
    });
    // Jika validasi gagal, Laravel balas 422 JSON (bukan 302) berkat header Accept
    if (!res.ok) {
      let msg = await res.text();
      try {
        const asJson = JSON.parse(msg);
        msg = asJson.message || msg;
      } catch (_) {}
      throw new Error(msg || "Gagal menyimpan data ke server");
    }
    return res.json();
  };

  // ---------------------------
  // ADMIN
  // ---------------------------
  const adminGetSurveys = async () => {
    const res = await authFetch(withBase(`/admin/surveys`));
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const adminGetSurvey = async (surveyId) => {
    const res = await authFetch(withBase(`/admin/surveys/${surveyId}`));
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const adminCreateSurvey = async (payload) => {
    const res = await authFetch(withBase(`/admin/surveys`), {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const adminUpdateSurvey = async (id, patch) => {
    const res = await authFetch(withBase(`/admin/surveys/${id}`), {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const adminUpsertServices = async (surveyId, items) => {
    const res = await authFetch(withBase(`/admin/surveys/${surveyId}/services`), {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const adminUpsertQuestions = async (surveyId, items) => {
    const res = await authFetch(withBase(`/admin/surveys/${surveyId}/questions`), {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const adminSetActive = async (id, is_active) => {
    const res = await authFetch(withBase(`/admin/surveys/${id}`), {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ is_active }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const adminSetPeriod = async (id, open_from, open_until) => {
    const res = await authFetch(withBase(`/admin/surveys/${id}`), {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ open_from, open_until }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const adminCloneSurvey = async (fromSurveyId, { year, semester, title }) => {
    const res = await authFetch(withBase(`/admin/surveys/${fromSurveyId}/clone`), {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ year, semester, title }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const adminGetSummary = async (surveyId) => {
    const res = await authFetch(withBase(`/admin/surveys/${surveyId}/summary`));
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const adminExportCSV = async (surveyId, type = "raw") => {
    const res = await authFetch(
      withBase(`/admin/surveys/${surveyId}/export?type=${encodeURIComponent(type)}`)
    );
    if (!res.ok) throw new Error(await res.text());
    return res.blob();
  };

  const adminListResponses = async (surveyId, { page = 1, q = "", service = "" } = {}) => {
    const params = new URLSearchParams({ page, q, service });
    const res = await authFetch(withBase(`/admin/surveys/${surveyId}/responses?${params}`));
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const adminUpdateResponse = async (id, payload) => {
    const res = await authFetch(withBase(`/admin/responses/${id}`), {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const adminDeleteResponse = async (id) => {
    const res = await authFetch(withBase(`/admin/responses/${id}`), {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  return {
    // PUBLIC
    getActiveSurvey,
    getAnalytics,
    submitResponse,

    // ADMIN
    adminGetSurveys,
    adminGetSurvey,
    adminCreateSurvey,
    adminUpdateSurvey,
    adminUpsertQuestions,
    adminUpsertServices,
    adminSetActive,
    adminSetPeriod,
    adminCloneSurvey,
    adminGetSummary,
    adminExportCSV,
    adminListResponses,
    adminUpdateResponse,
    adminDeleteResponse,
  };
}
