/** Site settings stored in the `settings` collection (single document, _id = "site"). */
import { db, ensureDb } from "@/lib/db/store";
import { bool, str, url } from "@/lib/validation";
import { isoNow } from "@/lib/utils";

export const DEFAULT_SETTINGS = {
  _id: "site",
  siteName: "MIC TECH",
  tagline: "Precision. Perspective. Pakistan.",
  description:
    "Independent reporting and analysis on Pakistan, world affairs, technology, business and culture.",
  contactEmail: "editor@mictech.news",
  address: "Karachi, Pakistan",
  social: {
    x: "https://x.com/mictechnews",
    facebook: "https://www.facebook.com/mictechnews",
    instagram: "",
    youtube: "https://www.youtube.com/@mictechnews",
    linkedin: "",
  },
  newsletterEnabled: true,
  commentsEnabled: true,
  commentsAutoApprove: false,
  breakingTickerEnabled: true,
  maintenanceMode: false,
  maintenanceMessage:
    "MIC TECH is performing scheduled maintenance. We will be back shortly.",
  defaultSeoTitle: "MIC TECH — News with precision and perspective",
  defaultSeoDescription:
    "Independent reporting and analysis on Pakistan, world affairs, technology, business and culture.",
  analyticsRetentionDays: 730,
  updatedAt: null,
};

export async function getSettings() {
  await ensureDb();
  try {
    const stored = await db.collection("settings").findOne({ _id: "site" });
    return {
      ...DEFAULT_SETTINGS,
      ...(stored || {}),
      social: { ...DEFAULT_SETTINGS.social, ...(stored?.social || {}) },
    };
  } catch (error) {
    console.warn(`[settings] falling back to defaults: ${error?.message || error}`);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function updateSettings(patch = {}) {
  await ensureDb();
  const current = await getSettings();
  const next = { ...current };
  if (Object.prototype.hasOwnProperty.call(patch, "siteName"))
    next.siteName = str(patch.siteName, "Site name", { min: 2, max: 60 });
  if (Object.prototype.hasOwnProperty.call(patch, "tagline"))
    next.tagline = str(patch.tagline, "Tagline", { max: 120, optional: true });
  if (Object.prototype.hasOwnProperty.call(patch, "description"))
    next.description = str(patch.description, "Description", { max: 400, optional: true });
  if (Object.prototype.hasOwnProperty.call(patch, "contactEmail"))
    next.contactEmail = str(patch.contactEmail, "Contact email", { max: 200, optional: true });
  if (Object.prototype.hasOwnProperty.call(patch, "address"))
    next.address = str(patch.address, "Address", { max: 200, optional: true });
  if (Object.prototype.hasOwnProperty.call(patch, "maintenanceMessage"))
    next.maintenanceMessage = str(patch.maintenanceMessage, "Maintenance message", {
      max: 400,
      optional: true,
    });
  if (Object.prototype.hasOwnProperty.call(patch, "defaultSeoTitle"))
    next.defaultSeoTitle = str(patch.defaultSeoTitle, "Default SEO title", {
      max: 70,
      optional: true,
    });
  if (Object.prototype.hasOwnProperty.call(patch, "defaultSeoDescription"))
    next.defaultSeoDescription = str(patch.defaultSeoDescription, "Default SEO description", {
      max: 160,
      optional: true,
    });
  if (patch.social && typeof patch.social === "object") {
    next.social = { ...next.social };
    for (const key of ["x", "facebook", "instagram", "youtube", "linkedin"]) {
      if (Object.prototype.hasOwnProperty.call(patch.social, key)) {
        next.social[key] = patch.social[key] ? url(patch.social[key], `Social ${key}`) : "";
      }
    }
  }
  for (const key of [
    "newsletterEnabled",
    "commentsEnabled",
    "commentsAutoApprove",
    "breakingTickerEnabled",
    "maintenanceMode",
  ]) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) next[key] = bool(patch[key], next[key]);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "analyticsRetentionDays")) {
    const days = Number(patch.analyticsRetentionDays);
    next.analyticsRetentionDays = Number.isFinite(days)
      ? Math.min(3650, Math.max(30, Math.round(days)))
      : current.analyticsRetentionDays;
  }
  next._id = "site";
  next.updatedAt = isoNow();

  const existing = await db.collection("settings").findOne({ _id: "site" });
  if (existing) await db.collection("settings").updateOne({ _id: "site" }, { $set: next });
  else await db.collection("settings").insertOne(next);
  return getSettings();
}

export async function getPublicSettings() {
  const settings = await getSettings();
  return {
    siteName: settings.siteName,
    tagline: settings.tagline,
    description: settings.description,
    contactEmail: settings.contactEmail,
    address: settings.address,
    social: settings.social,
    newsletterEnabled: settings.newsletterEnabled,
    commentsEnabled: settings.commentsEnabled,
    breakingTickerEnabled: settings.breakingTickerEnabled,
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
  };
}
