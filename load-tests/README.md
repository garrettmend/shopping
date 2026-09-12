# Order load test

This k6 test exercises login and concurrent order creation against a staging backend. It does not create Stripe payments.

## Run

Install k6, then set the test environment variables in PowerShell:

```powershell
$env:BASE_URL="https://your-backend.up.railway.app"
$env:PRODUCT_ID="product-id-from-api-products"
$env:TEST_EMAIL="loadtest@example.com"
$env:TEST_PASSWORD="your-test-password"
$env:VUS="20"
$env:DURATION="30s"
k6 run load-tests/order-load.js
```

Use a staging database and test account. `VUS=100` simulates 100 concurrent virtual users. The test accepts HTTP 400 responses because the current product stock may be exhausted during the run.

Never put production credentials in this file or commit them to Git.
