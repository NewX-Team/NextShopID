import { app } from "./app";
import { ENV } from "./config/env";

// Start Server HTTP
app.listen(ENV.PORT, () => {
  console.log(`[NextShopID Backend] Server running on http://localhost:${ENV.PORT}`);
  console.log(`[NextShopID Backend] API endpoint: http://localhost:${ENV.PORT}/api`);
  console.log(`[NextShopID Backend] Swagger docs: http://localhost:${ENV.PORT}/api/docs`);
});
