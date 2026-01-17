import bcrypt from 'bcryptjs';

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
  private listId = 'ce3a752e-7609-4468-81f8-8babaf503ad8'; // 主表 ID
  private memberListId = 'c01997f9-3589-45ff-bccc-d9b0f16d6770'; // 成員表 ID

  constructor(token: string) {
    this.graphToken = token;
  }

  /**
   * 🔐 登入：透過 AliasEmail 搵用戶
   */
  async getUserByAliasEmail(aliasemail: string): Promise<any> {
    try {
    const listId = 'c01997f9-3589-45ff-bccc-d9b0f16d6770';
      const url = `https://graph.microsoft.com/v1.0/sites/${this.siteId}/lists/${listId}/items?$filter=fields/AliasEmail eq '${aliasemail}'&$expand=fields`;

const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${this.graphToken}`,
        'Prefer': 'HonorNonIndexedQueriesWarningMayFailOverTime' // ✅ 加多呢行 Header 增加成功率
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Graph API 報錯詳情:", errorData);
      return null;
    }

    const data = await response.json();
    if (data.value && data.value.length > 0) {
      return data.value[0].fields; 
    }
    return null;
  } catch (error) {
    console.error("搵唔到用戶:", error);
    return null;
  }
}

  /**
   * 👤 建立新成員（Hash 密碼後儲存）
   */
  async createMember(name: string, aliasemail: string, plainPassword: string, role: string) {
    try {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(plainPassword, salt);

      const payload = {
        fields: {
          AliasEmail: aliasemail,
          Name: name,
          PasswordHash: hash,
          Role: role
        }
      };

      const url = `https://graph.microsoft.com/v1.0/sites/${this.siteId}/lists/${this.memberListId}/items`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.graphToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      return response.ok;
    } catch (error) {
      console.error("建立成員失敗:", error);
      return false;
    }
  }

  // ... 之後保留你原本嘅 updateShopScheduleStatus, batchUpdateSchedules 等方法 ...
  
  async updateShopScheduleStatus(itemId: string, scheduleStatus: string, scheduledDate?: string, groupId?: number): Promise<void> {
    const fields: Record<string, any> = { ScheduleStatus: scheduleStatus };
    if (scheduledDate) fields['ScheduledDate'] = scheduledDate;
    if (groupId) fields['GroupId'] = groupId;

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
    if (!response.ok) throw new Error(`Update failed`);
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${this.siteId}`, {
        headers: { 'Authorization': `Bearer ${this.graphToken}` }
      });
      return response.ok;
    } catch { return false; }
  }
}

export default SharePointService;
export type { SaveSchedulePayload, BatchUpdatePayload };
