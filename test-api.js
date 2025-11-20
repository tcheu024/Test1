// Simple API test script
const axios = require("axios");
require("dotenv").config();

async function testAPI() {
  const apiKey = process.env.RIOT_API_KEY;
  console.log(
    `Testing API key: ${apiKey ? apiKey.substring(0, 15) + "..." : "NOT FOUND"}`
  );

  try {
    // Test with a simple API call
    const response = await axios.get(
      "https://na.api.riotgames.com/riot/account/v1/accounts/by-riot-id/sentimental/na2",
      {
        headers: { "X-Riot-Token": apiKey },
        timeout: 10000,
      }
    );

    console.log("✅ API call successful!");
    console.log("Response:", response.data);
  } catch (error) {
    console.log("❌ API call failed:");
    console.log("Status:", error.response?.status);
    console.log("Message:", error.response?.data);
    console.log("Headers sent:", { "X-Riot-Token": apiKey });
  }
}

testAPI();
