import request from "supertest";
import { createApp } from "../src/app";

describe("GET /api/v1/health", () => {
  it("should return 200 with ok status when the server is running", async () => {
    const app = createApp();

    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: "ok" } });
  });
});
