// src/backup/drive.js
import * as AuthSession from "expo-auth-session";
import { Platform } from "react-native";

const SCOPES = ["https://www.googleapis.com/auth/drive.appdata"];
const DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
};

let accessToken = null;
let expiresAt = 0; 

const nowSec = () => Math.floor(Date.now() / 1000);

function authHeaders() {
  if (!accessToken || nowSec() >= (expiresAt || 0)) {
    throw new Error("Not signed in or token expired");
  }
  return { Authorization: `Bearer ${accessToken}` };
} 
export async function signInAsync(clientId) {
  if (!clientId || clientId.includes("<YOUR")) {
    throw new Error("Provide a valid Google OAuth clientId");
  }
 
  const useProxy = Platform.OS === "web" || __DEV__;
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: useProxy ? undefined : "seeitthrough",
    useProxy,
  });

  const params = new URLSearchParams({
    response_type: "token",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES.join(" "), 
    include_granted_scopes: "true",
    prompt: "consent",
  });

  const res = await AuthSession.startAsync({
    authUrl: `${DISCOVERY.authorizationEndpoint}?${params.toString()}`,
    returnUrl: redirectUri,
  });

  if (res?.type === "success" && res.params?.access_token) {
    accessToken = res.params.access_token;
    const ttl = parseInt(res.params.expires_in || "3600", 10);
    expiresAt = nowSec() + (isFinite(ttl) ? ttl : 3600);
    return true;
  }
 
  throw new Error(
    res?.type === "dismiss" ? "Sign-in dismissed" : "Sign-in cancelled"
  );
}
 
async function findLatestFileByName(filename) {
  const q = encodeURIComponent(
    `name='${filename}' and 'appDataFolder' in parents`
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=appDataFolder&orderBy=modifiedTime desc&pageSize=1&fields=files(id,name,modifiedTime)`;
  const resp = await fetch(url, { headers: authHeaders() });
  if (!resp.ok) throw new Error("Drive list failed " + resp.status);
  const data = await resp.json();
  return data?.files?.[0] || null;
}
 
export async function backupJson(filename, jsonObj) {
  if (!filename) throw new Error("Missing filename");
  if (!jsonObj || typeof jsonObj !== "object")
    throw new Error("jsonObj must be an object");
 
  if (!accessToken || nowSec() >= (expiresAt || 0)) {
    throw new Error("Not signed in");
  }

  const boundary = "----sit_drive_" + Date.now();
  const CRLF = "\r\n";

  const metadataPart =
    `--${boundary}${CRLF}` +
    `Content-Type: application/json; charset=UTF-8${CRLF}${CRLF}` +
    JSON.stringify({ name: filename, parents: ["appDataFolder"] }) +
    CRLF;

  const dataPart =
    `--${boundary}${CRLF}` +
    `Content-Type: application/json${CRLF}${CRLF}` +
    JSON.stringify(jsonObj) +
    CRLF +
    `--${boundary}--`;

  const body = metadataPart + dataPart;
 
  const existing = await findLatestFileByName(filename);
  const base = "https://www.googleapis.com/upload/drive/v3/files";
  const url = existing
    ? `${base}/${existing.id}?uploadType=multipart`
    : `${base}?uploadType=multipart`;

  const method = existing ? "PATCH" : "POST";

  const resp = await fetch(url, {
    method,
    headers: {
      ...authHeaders(),
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Drive upload failed ${resp.status}: ${text}`);
  }
  return true;
}
 
export async function restoreLatestJson(filename) {
  if (!filename) throw new Error("Missing filename");

  if (!accessToken || nowSec() >= (expiresAt || 0)) {
    throw new Error("Not signed in");
  }

  const file = await findLatestFileByName(filename);
  if (!file) throw new Error("No backup found");

  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
    { headers: authHeaders() }
  );
  if (!resp.ok) throw new Error("Drive download failed " + resp.status);
 
  return await resp.json();
}
 
export async function restoreLatest(filename) {
  return restoreLatestJson(filename);
}
