const LOCAL_DATABASE_URL = "file:local.db";
const DEFAULT_SITE_URL = "https://www.askore.kr";

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function getDatabaseConfig() {
  return {
    url: readEnv("TURSO_DATABASE_URL") ?? LOCAL_DATABASE_URL,
    authToken: readEnv("TURSO_AUTH_TOKEN")
  };
}

export function getSiteUrl() {
  return readEnv("NEXT_PUBLIC_SITE_URL") ?? DEFAULT_SITE_URL;
}

export function getIndexNowConfig() {
  return {
    key: readEnv("INDEXNOW_KEY"),
    internalToken: readEnv("INTERNAL_API_TOKEN")
  };
}

export const publicEnv = {
  siteUrl: getSiteUrl(),
  ga4Id: readEnv("NEXT_PUBLIC_GA4_ID"),
  adsensePubId:
    readEnv("NEXT_PUBLIC_ADSENSE_PUB_ID") ??
    readEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID"),
  adsenseSlots: {
    homeTop: readEnv("NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP"),
    contentMid: readEnv("NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_MID"),
    contentBottom: readEnv("NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_BOTTOM")
  }
};
