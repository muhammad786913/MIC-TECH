import { absoluteUrl } from "@/lib/utils";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/account",
          "/account/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/maintenance",
          "/search?",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: new URL(absoluteUrl("/")).origin,
  };
}
