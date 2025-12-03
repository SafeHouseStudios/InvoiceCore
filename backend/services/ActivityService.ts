import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ActivityService {
  
  // 1. Create Log Entry
  static async log(userId: number, action: string, description: string, entityType?: string, entityId?: string, ip?: string) {
    try {
      // Clean IP string if it contains multiple comma-separated IPs (x-forwarded-for)
      const cleanIp = ip ? ip.split(',')[0].trim() : 'Unknown';

      await prisma.activityLog.create({
        data: {
          user_id: userId,
          action,
          description,
          entity_type: entityType,
          entity_id: entityId,
          ip_address: cleanIp
        }
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }

  // 2. Fetch Logs
  static async getLogs(limit = 100) {
    return await prisma.activityLog.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { email: true, role: true }
        }
      }
    });
  }

  // 3. Log Rotation (Cleanup)
  static async pruneLogs(daysToKeep = 7) {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysToKeep);

      const result = await prisma.activityLog.deleteMany({
        where: {
          created_at: {
            lt: dateThreshold
          }
        }
      });
      console.log(`[ActivityService] Pruned ${result.count} logs older than ${daysToKeep} days.`);
    } catch (error) {
      console.error("[ActivityService] Failed to prune logs:", error);
    }
  }
}