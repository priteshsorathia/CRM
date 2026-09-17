export function getApiBase() {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";

  const trimmed = String(raw || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";

  if (typeof window === "undefined") return trimmed;

  try {
    const url = new URL(trimmed);
    const pageHost = window.location.hostname;
    const pageProtocol = window.location.protocol;

    // If app is opened via LAN IP on mobile, an env API like http://localhost:8001 will not work.
    // In that case, re-point localhost/127.0.0.1 to the current hostname, keeping protocol/port.
    if (
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      pageHost &&
      pageHost !== "localhost" &&
      pageHost !== "127.0.0.1"
    ) {
      url.hostname = pageHost;
    }

    // Upgrade to HTTPS if page is HTTPS and API is HTTP (to avoid Mixed Content problems)
    if (
      pageProtocol === "https:" &&
      url.protocol === "http:" &&
      url.hostname !== "localhost" &&
      url.hostname !== "127.0.0.1" &&
      !url.hostname.startsWith("192.168.")
    ) {
      url.protocol = "https:";
    }

    return url.toString().replace(/\/+$/, "");
  } catch {
    return trimmed;
  }
}

