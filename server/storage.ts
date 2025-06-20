import { db, Chart } from "../db";
import * as schema from "@shared/schema";
import { eq, and, desc, or } from "drizzle-orm";
import fs from "fs";
import { read, utils } from "xlsx";

export interface StorageInterface {
  // User functions
  getUserByUid(uid: string): Promise<schema.User | null>;
  createUser(userData: { uid: string; email: string; displayName?: string }): Promise<schema.User>;
  
  // File functions
  processExcelFile(filePath: string, fileName: string, fileSize: number, userUid: string): Promise<schema.File & { userId: number }>;
  getFilesByUserId(userUid: string): Promise<schema.File[]>;
  getFileById(fileId: number, userUid: string): Promise<schema.File | null>;
  
  // Chart functions
  createChart(chartData: {
    name: string | null;
    fileId: number;
    userId: string;
    chartType: string;
    xAxis: string;
    yAxis: string;
  }): Promise<schema.Chart & { userId: number }>;
  getChartsByUserId(userUid: string): Promise<schema.Chart[]>;
  deleteChart(chartId: number, userUid: string): Promise<boolean>;
  shareChart(chartId: number, recipientEmail: string, sharerUid: string): Promise<{ chartId: number; sharedWithUserId: number }>;
  getSharedCharts(userUid: string): Promise<any[]>;
  
  // Activity functions
  createActivity(activityData: {
    userId: number;
    fileId?: number | null;
    chartId?: number | null;
    type: string;
    description: string;
  }): Promise<schema.Activity>;
  getActivitiesByUserId(userUid: string): Promise<schema.Activity[]>;
  getUserStats(userUid: string): Promise<{
    totalUploads: number;
    chartsCreated: number;
    downloads: number;
    sharedCharts: number;
  }>;
}

export const storage: StorageInterface = {
  // User functions
  async getUserByUid(uid: string): Promise<schema.User | null> {
    const users = await db.query.users.findMany({
      where: eq(schema.users.uid, uid),
    });

    return users.length > 0 ? users[0] : null;
  },

  async createUser(userData: { uid: string; email: string; displayName?: string }): Promise<schema.User> {
    const [user] = await db.insert(schema.users)
      .values({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName || null,
      })
      .returning();

    return user;
  },

  // File functions
  async processExcelFile(filePath: string, fileName: string, fileSize: number, userUid: string): Promise<schema.File & { userId: number }> {
    // Read the Excel file
    const workbook = read(fs.readFileSync(filePath), { type: 'buffer' });
    
    // Get the first worksheet
    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];
    
    // Convert to JSON
    const jsonData = utils.sheet_to_json(worksheet);
    
    // Extract headers (if data is empty, headers will be an empty array)
    const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
    
    // Get the user record
    const user = await this.getUserByUid(userUid);
    if (!user) {
      throw new Error('User not found');
    }

    // Insert the file record in the database
    const [file] = await db.insert(schema.files)
      .values({
        fileName,
        filePath,
        fileSize,
        headers: headers as any,
        data: jsonData as any,
        userId: user.id,
      })
      .returning();

    return file;
  },

  async getFilesByUserId(userUid: string): Promise<schema.File[]> {
    const user = await this.getUserByUid(userUid);
    if (!user) {
      return [];
    }

    return db.query.files.findMany({
      where: eq(schema.files.userId, user.id),
      orderBy: [desc(schema.files.createdAt)],
    });
  },

  async getFileById(fileId: number, userUid: string): Promise<schema.File | null> {
    const user = await this.getUserByUid(userUid);
    if (!user) {
      return null;
    }

    const files = await db.query.files.findMany({
      where: and(
        eq(schema.files.id, fileId),
        eq(schema.files.userId, user.id)
      ),
    });

    return files.length > 0 ? files[0] : null;
  },

  // Chart functions
  async createChart(chartData: {
    name: string | null;
    fileId: number;
    userId: string;
    chartType: string;
    xAxis: string;
    yAxis: string;
  }): Promise<schema.Chart & { userId: number }> {
    const user = await this.getUserByUid(chartData.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const [chart] = await db.insert(schema.charts)
      .values({
        name: chartData.name,
        fileId: chartData.fileId,
        userId: user.id,
        chartType: chartData.chartType,
        xAxis: chartData.xAxis,
        yAxis: chartData.yAxis,
      })
      .returning();

    return chart;
  },

  async getChartsByUserId(userUid: string): Promise<schema.Chart[]> {
    const user = await this.getUserByUid(userUid);
    if (!user) {
      return [];
    }

    const chartsWithFiles = await db.query.charts.findMany({
      where: eq(schema.charts.userId, user.id),
      orderBy: [desc(schema.charts.createdAt)],
      with: {
        file: true,
      },
    });

    // Return a simplified version with file name
    return chartsWithFiles.map(chart => ({
      ...chart,
      fileName: chart.file.fileName,
    }));
  },

  async deleteChart(chartId: number, userUid: string): Promise<boolean> {
    const user = await this.getUserByUid(userUid);
    if (!user) {
      return false;
    }

    const result = await db.delete(schema.charts)
      .where(
        and(
          eq(schema.charts.id, chartId),
          eq(schema.charts.userId, user.id)
        )
      )
      .returning();

    return result.length > 0;
  },

  async shareChart(chartId: number, recipientEmail: string, sharerUid: string): Promise<{ chartId: number; sharedWithUserId: number }> {
    // Get the sharer's user record
    const sharer = await this.getUserByUid(sharerUid);
    if (!sharer) {
      throw new Error('Sharer not found');
    }

    // Get the recipient's user record by email
    const recipients = await db.query.users.findMany({
      where: eq(schema.users.email, recipientEmail),
    });

    let recipient = recipients.length > 0 ? recipients[0] : null;

    if (!recipient) {
      // If recipient doesn't exist yet, create a placeholder user
      recipient = await db.insert(schema.users)
        .values({
          uid: `placeholder-${Date.now()}`,
          email: recipientEmail,
          displayName: recipientEmail.split('@')[0],
        })
        .returning()
        .then(users => users[0]);
    }

    // Create the shared chart record
    const [sharedChart] = await db.insert(schema.sharedCharts)
      .values({
        chartId,
        sharedByUserId: sharer.id,
        sharedWithUserId: recipient.id,
      })
      .returning();

    return {
      chartId: sharedChart.chartId,
      sharedWithUserId: sharedChart.sharedWithUserId,
    };
  },

  async getSharedCharts(userUid: string): Promise<any[]> {
    const user = await this.getUserByUid(userUid);
    if (!user) {
      return [];
    }

    const sharedCharts = await db.query.sharedCharts.findMany({
      where: eq(schema.sharedCharts.sharedWithUserId, user.id),
      with: {
        chart: {
          with: {
            file: true,
            user: true,
          },
        },
        sharedByUser: true,
      },
    });

    // Transform to expected format
    return sharedCharts.map(shared => ({
      id: shared.id,
      chartId: shared.chartId,
      chartType: shared.chart.chartType,
      xAxis: shared.chart.xAxis,
      yAxis: shared.chart.yAxis,
      name: shared.chart.name,
      fileName: shared.chart.file.fileName,
      fileId: shared.chart.fileId,
      createdAt: shared.createdAt,
      sharedBy: shared.sharedByUser.displayName || shared.sharedByUser.email,
    }));
  },

  // Activity functions
  async createActivity(activityData: {
    userId: number;
    fileId?: number | null;
    chartId?: number | null;
    type: string;
    description: string;
  }): Promise<schema.Activity> {
    const [activity] = await db.insert(schema.activities)
      .values({
        userId: activityData.userId,
        fileId: activityData.fileId || null,
        chartId: activityData.chartId || null,
        type: activityData.type,
        description: activityData.description,
      })
      .returning();

    return activity;
  },

  async getActivitiesByUserId(userUid: string): Promise<schema.Activity[]> {
    const user = await this.getUserByUid(userUid);
    if (!user) {
      return [];
    }

    const activities = await db.query.activities.findMany({
      where: eq(schema.activities.userId, user.id),
      orderBy: [desc(schema.activities.timestamp)],
      limit: 10,
      with: {
        file: true,
        chart: true,
      },
    });

    // Transform to include file and chart names
    return activities.map(activity => ({
      ...activity,
      fileName: activity.file?.fileName || (activity.chart?.file ? 'Chart file' : ''),
    }));
  },

  async getUserStats(userUid: string): Promise<{
    totalUploads: number;
    chartsCreated: number;
    downloads: number;
    sharedCharts: number;
  }> {
    const user = await this.getUserByUid(userUid);
    if (!user) {
      return {
        totalUploads: 0,
        chartsCreated: 0,
        downloads: 0,
        sharedCharts: 0,
      };
    }

    // Count uploads (files)
    const uploadActivities = await db.query.activities.findMany({
      where: and(
        eq(schema.activities.userId, user.id),
        eq(schema.activities.type, 'upload')
      ),
    });

    // Count chart creations
    const charts = await db.query.charts.findMany({
      where: eq(schema.charts.userId, user.id),
    });

    // Count downloads
    const downloadActivities = await db.query.activities.findMany({
      where: and(
        eq(schema.activities.userId, user.id),
        eq(schema.activities.type, 'download')
      ),
    });

    // Count shared charts
    const sharedCharts = await db.query.sharedCharts.findMany({
      where: eq(schema.sharedCharts.sharedByUserId, user.id),
    });

    return {
      totalUploads: uploadActivities.length,
      chartsCreated: charts.length,
      downloads: downloadActivities.length,
      sharedCharts: sharedCharts.length,
    };
  },
};
