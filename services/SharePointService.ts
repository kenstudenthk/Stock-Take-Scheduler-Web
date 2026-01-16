interface SaveSchedulePayload {
  shopId: string;
  itemId: string;
  scheduledDate: string;
  groupId: number;
  dayOfWeek: string;
  scheduleStatus: string;
  groupLabel: string;
}

interface BatchUpdatePayload {
  requests: Array<{
    id: string;
    method: string;
    url: string;
    body: Record<string, any>;
  }>;
}

class SharePointService {
  private graphToken: string;
  private siteId = 'pccw0.sharepoint.com:/sites/BonniesTeam';
  private listId = 'ce3a752e-7609-4468-81f8-8babaf503ad8';

  constructor(token: string) {
    this.graphToken = token;
  }

  /**
   * 🔄 Update Single Shop Schedule Status
   */
  async updateShopScheduleStatus(
    itemId: string,
    scheduleStatus: string,
    scheduledDate?: string,
    groupId?: number
  ): Promise<void> {
    const fields: Record<string, any> = {
      ScheduleStatus: scheduleStatus,
    };

    if (scheduledDate) {
      fields['ScheduledDate'] = scheduledDate; // Adjust field name if different
    }

    if (groupId) {
      fields['GroupId'] = groupId;
    }

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${this.siteId}/lists/${this.listId}/items/${itemId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.graphToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update item ${itemId}: ${error.error?.message || response.statusText}`);
    }

    console.log(`✅ Updated item ${itemId} with status: ${scheduleStatus}`);
  }

  /**
   * 📦 Batch Update Multiple Shops (More Efficient)
   */
  async batchUpdateSchedules(
    updates: SaveSchedulePayload[]
  ): Promise<void> {
    if (updates.length === 0) return;

    // Microsoft Graph Batch API supports up to 20 requests per batch
    const batchSize = 20;
    const batches = [];

    for (let i = 0; i < updates.length; i += batchSize) {
      batches.push(updates.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const requests = batch.map((update, index) => ({
        id: String(index + 1),
        method: 'PATCH',
        url: `/sites/${this.siteId}/lists/${this.listId}/items/${update.itemId}`,
        body: {
          fields: {
            ScheduleStatus: update.scheduleStatus,
            ScheduledDate: update.scheduledDate,
            GroupId: update.groupId,
            GroupLabel: update.groupLabel,
          },
        },
      }));

      const batchPayload: BatchUpdatePayload = { requests };

      try {
        const response = await fetch(
          'https://graph.microsoft.com/v1.0/$batch',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.graphToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(batchPayload),
          }
        );

        if (!response.ok) {
          throw new Error(`Batch update failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`✅ Batch update completed: ${batch.length} items updated`);
        
        // Check for individual errors
        if (result.responses) {
          result.responses.forEach((resp: any) => {
            if (resp.status >= 400) {
              console.error(`⚠️ Error in batch request ${resp.id}: ${resp.body?.error?.message}`);
            }
          });
        }
      } catch (error) {
        console.error('❌ Batch update error:', error);
        throw error;
      }
    }
  }

  /**
   * 💾 Save Schedule as Audit Trail (Create new records in a separate list)
   */
  
  // 喺 SharePointService class 入面加入
async getUserByEmail(email: string): Promise<any> {
  try {
    const listId = 'c01997f9-3589-45ff-bccc-d9b0f16d6770';
    // 透過 Graph API Filter 功能搵對應 Email 嘅 Item
    const url = `https://graph.microsoft.com/v1.0/sites/${this.siteId}/lists/${listId}/items?$filter=fields/Email eq '${email}'&$expand=fields($select=Email,Name,PasswordHash,UserRole)`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${this.graphToken}` }
    });
    
    const data = await response.json();
    
    if (data.value && data.value.length > 0) {
      return data.value[0].fields; // 傳回用戶資料
    }
    return null;
  } catch (error) {
    console.error("搵唔到用戶:", error);
    return null;
  }
}
  async saveScheduleAuditTrail(
    schedules: Array<{
      shopId: string;
      shopName: string;
      scheduledDate: string;
      groupId: number;
      groupLabel: string;
      scheduleStatus: string;
      createdBy: string;
      createdDate: string;
    }>,
    auditListId: string // Separate audit list ID
  ): Promise<void> {
    const auditRecords = schedules.map(schedule => ({
      fields: {
        Title: `${schedule.shopName} - ${schedule.scheduledDate}`,
        ShopId: schedule.shopId,
        ShopName: schedule.shopName,
        ScheduledDate: schedule.scheduledDate,
        GroupId: schedule.groupId,
        GroupLabel: schedule.groupLabel,
        ScheduleStatus: schedule.scheduleStatus,
        CreatedBy: schedule.createdBy,
        CreatedDate: schedule.createdDate,
      },
    }));

    for (const record of auditRecords) {
      try {
        const response = await fetch(
          `https://graph.microsoft.com/v1.0/sites/${this.siteId}/lists/${auditListId}/items`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.graphToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(record),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          console.error(`❌ Failed to create audit record: ${error.error?.message}`);
        } else {
          console.log(`✅ Audit record created: ${record.fields.Title}`);
        }
      } catch (error) {
        console.error('❌ Error creating audit record:', error);
      }
    }
  }

  /**
   * 📥 Fetch Item IDs from SharePoint (mapping shopId to itemId)
   */
  async fetchShopItemIds(): Promise<Map<string, string>> {
    const itemIdMap = new Map<string, string>();

    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${this.siteId}/lists/${this.listId}/items?$select=id,fields(field_6)&$top=5000`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.graphToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch items: ${response.statusText}`);
      }

      const data = await response.json();
      data.value?.forEach((item: any) => {
        const shopCode = item.fields?.field_6; // Your shop code field
        if (shopCode && item.id) {
          itemIdMap.set(shopCode, item.id);
        }
      });

      console.log(`✅ Fetched ${itemIdMap.size} shop item mappings`);
      return itemIdMap;
    } catch (error) {
      console.error('❌ Error fetching shop item IDs:', error);
      throw error;
    }
  }

  /**
   * 🔐 Validate and Test Connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${this.siteId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.graphToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('❌ Connection validation failed');
        return false;
      }

      console.log('✅ SharePoint connection validated');
      return true;
    } catch (error) {
      console.error('❌ Connection error:', error);
      return false;
    }
  }
}

export default SharePointService;
export type { SaveSchedulePayload, BatchUpdatePayload };