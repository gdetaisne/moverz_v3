import http from "node:http";

const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const id = process.argv[2];
if (!id) {
  console.log("Usage: node scripts/probe-image.js <photoIdOrFilename>");
  process.exit(1);
}
const url = id.endsWith(".jpeg") ? `${base}/api/uploads/${id}` : `${base}/api/uploads/${id}.jpeg`;

http.get(url, (res) => {
  console.log("GET", url, "→", res.statusCode, res.headers["content-type"]);
}).on("error", (e) => {
  console.error("Request failed:", e.message);
});
