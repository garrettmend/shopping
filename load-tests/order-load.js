import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.BASE_URL;
const testEmail = __ENV.TEST_EMAIL;
const testPassword = __ENV.TEST_PASSWORD;
const productId = __ENV.PRODUCT_ID;

export const options = {
  scenarios: {
    concurrent_orders: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS || 20),
      duration: __ENV.DURATION || "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
  },
};

export function setup() {
  if (!baseUrl || !testEmail || !testPassword || !productId) {
    throw new Error("Set BASE_URL, TEST_EMAIL, TEST_PASSWORD, and PRODUCT_ID");
  }

  const response = http.post(
    `${baseUrl}/api/auth/login`,
    JSON.stringify({ email: testEmail, password: testPassword }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(response, {
    "login succeeded": (result) => result.status === 200,
  });

  if (response.status !== 200) {
    throw new Error(`Login failed with status ${response.status}`);
  }

  return { token: response.json("token") };
}

export default function (data) {
  const response = http.post(
    `${baseUrl}/api/orders`,
    JSON.stringify({
      items: [{ productId, quantity: 1 }],
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.token}`,
      },
    },
  );

  check(response, {
    "order request completed": (result) =>
      result.status === 201 || result.status === 400,
  });

  sleep(1);
}
