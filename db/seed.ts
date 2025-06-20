import { db } from "./index";
import * as schema from "@shared/schema";

async function seed() {
  try {
    console.log("🌱 Seeding database...");

    // Check if there's already seed data to avoid duplicates
    const existingUsers = await db.query.users.findMany();
    if (existingUsers.length > 0) {
      console.log("Database already has data, skipping seed");
      return;
    }

    // Create sample users
    console.log("Creating sample users...");
    const [user1] = await db.insert(schema.users)
      .values({
        uid: "sample-user-1",
        email: "alex@example.com",
        displayName: "Alex Brown",
      })
      .returning();

    const [user2] = await db.insert(schema.users)
      .values({
        uid: "sample-user-2",
        email: "sarah@example.com",
        displayName: "Sarah Johnson",
      })
      .returning();

    // Create sample files for the first user
    console.log("Creating sample files...");
    const sampleData1 = [
      { Month: "January", Sales: 45000, Expenses: 32000, Profit: 13000 },
      { Month: "February", Sales: 48500, Expenses: 31400, Profit: 17100 },
      { Month: "March", Sales: 52000, Expenses: 33500, Profit: 18500 },
      { Month: "April", Sales: 46800, Expenses: 32700, Profit: 14100 },
      { Month: "May", Sales: 49700, Expenses: 31900, Profit: 17800 },
    ];

    const [file1] = await db.insert(schema.files)
      .values({
        fileName: "Sales_Report_2023.xlsx",
        filePath: "/uploads/sample-sales-report.xlsx",
        fileSize: 12345,
        headers: ["Month", "Sales", "Expenses", "Profit"],
        data: sampleData1,
        userId: user1.id,
      })
      .returning();

    const sampleData2 = [
      { Product: "Widget A", "Q1 Sales": 1200, "Q2 Sales": 1450, "Q3 Sales": 1320, "Q4 Sales": 1600 },
      { Product: "Widget B", "Q1 Sales": 980, "Q2 Sales": 1100, "Q3 Sales": 1050, "Q4 Sales": 1250 },
      { Product: "Widget C", "Q1 Sales": 750, "Q2 Sales": 820, "Q3 Sales": 940, "Q4 Sales": 1100 },
      { Product: "Widget D", "Q1 Sales": 1500, "Q2 Sales": 1420, "Q3 Sales": 1350, "Q4 Sales": 1480 },
    ];

    const [file2] = await db.insert(schema.files)
      .values({
        fileName: "Product_Metrics_Q1.xlsx",
        filePath: "/uploads/sample-product-metrics.xlsx",
        fileSize: 10987,
        headers: ["Product", "Q1 Sales", "Q2 Sales", "Q3 Sales", "Q4 Sales"],
        data: sampleData2,
        userId: user1.id,
      })
      .returning();

    const sampleData3 = [
      { Category: "Food", Budget: 500, Actual: 520 },
      { Category: "Transportation", Budget: 300, Actual: 280 },
      { Category: "Entertainment", Budget: 200, Actual: 250 },
      { Category: "Utilities", Budget: 400, Actual: 380 },
      { Category: "Savings", Budget: 600, Actual: 500 },
    ];

    const [file3] = await db.insert(schema.files)
      .values({
        fileName: "Budget_Analysis_Q2.xlsx",
        filePath: "/uploads/sample-budget-analysis.xlsx",
        fileSize: 8765,
        headers: ["Category", "Budget", "Actual"],
        data: sampleData3,
        userId: user1.id,
      })
      .returning();

    // Create sample charts
    console.log("Creating sample charts...");
    const [chart1] = await db.insert(schema.charts)
      .values({
        name: "Monthly Sales Performance",
        fileId: file1.id,
        userId: user1.id,
        chartType: "bar",
        xAxis: "Month",
        yAxis: "Sales",
      })
      .returning();

    const [chart2] = await db.insert(schema.charts)
      .values({
        name: "Profit Trends",
        fileId: file1.id,
        userId: user1.id,
        chartType: "line",
        xAxis: "Month",
        yAxis: "Profit",
      })
      .returning();

    const [chart3] = await db.insert(schema.charts)
      .values({
        name: "Budget vs Actual",
        fileId: file3.id,
        userId: user1.id,
        chartType: "bar",
        xAxis: "Category",
        yAxis: "Budget",
      })
      .returning();

    // Create sample activities
    console.log("Creating sample activities...");
    await db.insert(schema.activities)
      .values([
        {
          userId: user1.id,
          fileId: file1.id,
          type: "upload",
          description: "Uploaded file Sales_Report_2023.xlsx",
          timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
        },
        {
          userId: user1.id,
          fileId: file2.id,
          type: "upload",
          description: "Uploaded file Product_Metrics_Q1.xlsx",
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
        },
        {
          userId: user1.id,
          chartId: chart1.id,
          type: "chart",
          description: "Created bar chart using Month and Sales",
          timestamp: new Date(Date.now() - 3000000), // 50 minutes ago
        },
        {
          userId: user1.id,
          chartId: chart2.id,
          type: "chart",
          description: "Created line chart using Month and Profit",
          timestamp: new Date(Date.now() - 1500000), // 25 minutes ago
        },
        {
          userId: user1.id,
          chartId: chart3.id,
          type: "chart",
          description: "Created bar chart using Category and Budget",
          timestamp: new Date(Date.now() - 600000), // 10 minutes ago
        },
        {
          userId: user1.id,
          fileId: file2.id,
          type: "download",
          description: "Downloaded chart as PDF",
          timestamp: new Date(Date.now() - 172800000), // 2 days ago
        },
      ]);

    // Share a chart with the second user
    console.log("Creating sample shared charts...");
    await db.insert(schema.sharedCharts)
      .values({
        chartId: chart3.id,
        sharedByUserId: user1.id,
        sharedWithUserId: user2.id,
      });

    console.log("✅ Seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
