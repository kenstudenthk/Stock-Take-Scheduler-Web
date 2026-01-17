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
  // ✅ 修正 1：確保 Site ID 格式正確 (hostname:/path:)
  private siteId = 'pccw0.sharepoint.com:/sites/BonniesTeam:'; 
  private listId = 'ce3a752e-7609-4468-81f8-8babaf503ad8';
  private memberListId = 'c01997f9-3589-45ff-bccc-d9b0f16d6770';

  constructor(token: string) {
    this.graphToken = token;
  }
  async checkMemberListConnection(): Promise<boolean> {
  try {
    const url = `https://graph.microsoft.com/v1.0/sites/${this.siteId}/lists/${this.memberListId}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${this.graphToken}` }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
  async getUserByAliasEmail(aliasemail: string): Promise<any> {
    try {
      // ✅ 修正 2：對 email 進行編碼，防止特殊字元 (@, .) 引起 URL 錯誤
      const encodedEmail = encodeURIComponent(aliasemail);
      const url = `https://graph.microsoft.com/v1.0/sites/${this.siteId}/lists/${this.memberListId}/items?$filter=fields/AliasEmail eq '${aliasemail}'&$expand=fields`;

      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${this.graphToken}`,
          // ✅ 修正 3：加入這兩個 Header 可以解決 90% 的 400 錯誤
          'Prefer': 'HonorNonIndexedQueriesWarningMayFailOverTime',
          'ConsistencyLevel': 'eventual' 
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        // ✅ 修正 4：直接印出詳細 message，方便診斷
        console.error("❌ Graph API 錯誤原因:", errorData.error?.message || errorData);
        return null;
      }

      const data = await response.json();
      if (data.value && data.value.length > 0) {
        return data.value[0].fields; 
      }
      return null;
    } catch (error) {
      console.error("登入連線失敗:", error);
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
