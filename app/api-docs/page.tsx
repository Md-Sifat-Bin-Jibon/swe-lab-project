import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Docs · SwapSpot",
  description: "Swagger UI for the SwapSpot REST API",
};

export default function ApiDocsPage() {
  return (
    <main className="h-screen w-full bg-white">
      <iframe
        title="SwapSpot API documentation"
        src="/swagger.html"
        className="h-full w-full border-0"
      />
    </main>
  );
}
