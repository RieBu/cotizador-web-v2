import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Incluye las plantillas DOCX en el bundle de las funciones serverless de
  // Vercel; se leen en runtime con readFileSync(process.cwd()/public/plantillas).
  outputFileTracingIncludes: {
    "/api/cotizaciones/docx": ["./public/plantillas/**"],
    "/api/cotizaciones/docx/preview": ["./public/plantillas/**"],
  },
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
