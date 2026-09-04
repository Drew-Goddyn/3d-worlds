import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "District 08 — Demolition Rewind",
  description:
    "A procedural Three.js downtown demolition playground with structural collapse, slow motion, and perfect rewind.",
};

const THREE_IMPORT_MAP = JSON.stringify({
  imports: {
    three: "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
    "three/addons/":
      "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/",
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="importmap"
          dangerouslySetInnerHTML={{ __html: THREE_IMPORT_MAP }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
