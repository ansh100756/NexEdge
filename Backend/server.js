import "dotenv/config";
import app from "./src/app.js";
import connectToDB from "./src/config/database.js";

const port = Number(process.env.PORT) || 3000;

connectToDB()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server started on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize MongoDB:", error);
    process.exitCode = 1;
  });
