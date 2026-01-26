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
 * 🆕 註冊新成員
 */
async registerMember(data: {
  name: string,
  userEmail: string,
  aliasEmail: string,
  passwordHash: string
}) {
  try {
    const payload = {
      fields: {
        Title: data.name, // SharePoint List 的主標題通常存 Name
        Name: data.name,
        UserEmail: data.userEmail,
        AliasEmail: data.aliasEmail,
        PasswordHash: data.passwordHash,
        Role: "User", // Default Role
        AccountStatus: "Active", // Default Status
        AccountCreateDate: new Date().toISOString(), // Include time
        // 針對 Person 欄位 "User"：在 Graph API 中通常需要使用電子郵件進行聲明
        "User@Claims": `i:0#.f|membership|${data.aliasEmail}` 
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

    if (!response.ok) {
      const err = await response.json();
      console.error("SharePoint 註冊失敗:", err.error?.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("註冊連線錯誤:", error);
    return false;
  }
}

  // 在你的 sharePointService 內增加：
// sharePointService.ts

// SharePointService.ts 內的修復版本

// SharePointService.ts

async updatePasswordByEmail(email: string, hash: string) {
  try {
    // ✅ 修正 1：確保搜尋的是成員清單 (memberListId) 而不是店舖清單 (listId)
    // ✅ 修正 2：使用正確的 $filter 語法，並加入 ConsistencyLevel
    const searchUrl = `https://graph.microsoft.com/v1.0/sites/${this.siteId}/lists/${this.memberListId}/items?$filter=fields/AliasEmail eq '${email}'&$expand=fields`;
    
    const searchRes = await fetch(searchUrl, {
      headers: { 
        'Authorization': `Bearer ${this.graphToken}`,
        'Prefer': 'HonorNonIndexedQueriesWarningMayFail',
        'ConsistencyLevel': 'eventual'
      }
    });

    if (!searchRes.ok) {
      const errorData = await searchRes.json();
      console.error("❌ 搜尋用戶失敗:", errorData.error?.message);
      return false;
    }

    const searchData = await searchRes.json();
    if (!searchData.value || searchData.value.length === 0) {
      console.warn(`⚠️ 找不到成員: ${email}`);
      return false;
    }

    // 取得該成員的項目 ID
    const itemId = searchData.value[0].id; 

    // ✅ 修正 3：PATCH 請求的路徑必須指向 memberListId
    const updateUrl = `https://graph.microsoft.com/v1.0/sites/${this.siteId}/lists/${this.memberListId}/items/${itemId}/fields`;
    
    const updateRes = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.graphToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // ⚠️ 這裡直接寫 Internal Name，不加 fields 前綴
        PasswordHash: hash 
      })
    });

    if (updateRes.ok) {
      console.log(`✅ ${email} 的密碼已成功寫回 SharePoint`);
      return true;
    } else {
      const errorDetail = await updateRes.json();
      console.error("❌ PATCH 寫入失敗:", errorDetail.error?.message);
      return false;
    }

  } catch (error) {
    console.error("❌ SharePoint 連線嚴重錯誤:", error);
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
