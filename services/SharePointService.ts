import bcrypt from "bcryptjs";
import { SHAREPOINT_CONFIG, API_URLS } from "../constants/config";
import { SP_FIELDS } from "../constants";
import { User, UserRole, TimeCardEntry } from "../types";

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
  private siteId: string;
  private listId: string;
  private memberListId: string;

  constructor(token: string) {
    this.graphToken = token;
    // Use config with fallbacks
    this.siteId = SHAREPOINT_CONFIG.siteId;
    this.listId = SHAREPOINT_CONFIG.shopListId;
    this.memberListId = SHAREPOINT_CONFIG.memberListId;
  }
  /**
   * Sanitize values for OData filter queries to prevent injection
   */
  private sanitizeFilterValue(value: string): string {
    // Escape single quotes by doubling them (OData standard)
    return value.replace(/'/g, "''").trim();
  }

  async checkMemberListConnection(): Promise<boolean> {
    try {
      const url = API_URLS.memberList;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${this.graphToken}` },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
  async getUserByAliasEmail(aliasemail: string): Promise<any> {
    try {
      // Sanitize email input to prevent OData injection
      const sanitizedEmail = this.sanitizeFilterValue(aliasemail);
      const url = `${API_URLS.memberList}/items?$filter=fields/AliasEmail eq '${sanitizedEmail}'&$expand=fields`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.graphToken}`,
          Prefer: "HonorNonIndexedQueriesWarningMayFailOverTime",
          ConsistencyLevel: "eventual",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "❌ Graph API 錯誤原因:",
          errorData.error?.message || errorData,
        );
        return null;
      }

      const data = await response.json();
      if (data.value && data.value.length > 0) {
        const fields = data.value[0].fields;
        // Map SharePoint field 'Role' to 'UserRole' expected by the app
        return {
          ...fields,
          UserRole: fields.Role || "User",
        };
      }
      return null;
    } catch (error) {
      console.error("登入連線失敗:", error);
      return null;
    }
  }

  async registerMember(data: {
    name: string;
    userEmail: string;
    aliasEmail: string;
    passwordHash: string;
  }) {
    try {
      const payload = {
        fields: {
          Title: data.name,
          Name: data.name,
          UserEmail: data.userEmail,
          AliasEmail: data.aliasEmail,
          PasswordHash: data.passwordHash,
          Role: "User",
          AccountStatus: "Active",
          AccountCreateDate: new Date().toISOString(),
          "User@Claims": `i:0#.f|membership|${data.aliasEmail}`,
        },
      };

      const url = `${API_URLS.memberList}/items`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.graphToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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

  async updatePasswordByEmail(email: string, hash: string) {
    try {
      const sanitizedEmail = this.sanitizeFilterValue(email);
      const searchUrl = `${API_URLS.memberList}/items?$filter=fields/AliasEmail eq '${sanitizedEmail}'&$expand=fields`;

      const searchRes = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${this.graphToken}`,
          Prefer: "HonorNonIndexedQueriesWarningMayFail",
          ConsistencyLevel: "eventual",
        },
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

      const itemId = searchData.value[0].id;
      const updateUrl = `${API_URLS.memberList}/items/${itemId}/fields`;

      const updateRes = await fetch(updateUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.graphToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ PasswordHash: hash }),
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

  private async updateShopFields(
    itemId: string,
    fields: Record<string, any>,
  ): Promise<void> {
    const response = await fetch(`${API_URLS.shopList}/items/${itemId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${this.graphToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.error?.message || `Update failed: ${response.status}`,
      );
    }
  }

  async rescheduleShop(
    itemId: string,
    date: string,
    groupId: number,
  ): Promise<void> {
    await this.updateShopFields(itemId, {
      [SP_FIELDS.STATUS]: "Rescheduled",
      [SP_FIELDS.SCHEDULE_DATE]: date,
      [SP_FIELDS.SCHEDULE_GROUP]: groupId.toString(),
    });
  }

  async closeShop(itemId: string): Promise<void> {
    await this.updateShopFields(itemId, { [SP_FIELDS.STATUS]: "Closed" });
  }

  async resumeShop(itemId: string): Promise<void> {
    await this.updateShopFields(itemId, { [SP_FIELDS.STATUS]: "Pending" });
  }

  async moveShopToPool(itemId: string): Promise<void> {
    await this.updateShopFields(itemId, {
      [SP_FIELDS.STATUS]: "Rescheduled",
      [SP_FIELDS.SCHEDULE_DATE]: null,
      [SP_FIELDS.SCHEDULE_GROUP]: null,
    });
  }

  async updateShopScheduleStatus(
    itemId: string,
    scheduleStatus: string,
    scheduledDate?: string,
    groupId?: number,
  ): Promise<void> {
    const fields: Record<string, any> = { [SP_FIELDS.STATUS]: scheduleStatus };
    if (scheduledDate) fields[SP_FIELDS.SCHEDULE_DATE] = scheduledDate;
    if (groupId !== undefined)
      fields[SP_FIELDS.SCHEDULE_GROUP] = groupId.toString();

    console.log("🔄 Updating shop schedule:", { itemId, fields });

    const response = await fetch(`${API_URLS.shopList}/items/${itemId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${this.graphToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Update failed:", response.status, errorData);
      throw new Error(
        errorData?.error?.message || `Update failed: ${response.status}`,
      );
    }

    console.log("✅ Update successful");
  }

  async batchUpdateShopSchedules(
    updates: Array<{
      itemId: string;
      scheduledDate: string;
      groupId: number;
      status: string;
    }>,
    onProgress?: (processed: number, total: number) => void,
  ): Promise<{
    success: number;
    failed: Array<{ itemId: string; error: string }>;
  }> {
    const results = {
      success: 0,
      failed: [] as Array<{ itemId: string; error: string }>,
    };

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      try {
        await this.updateShopScheduleStatus(
          update.itemId,
          update.status,
          update.scheduledDate,
          update.groupId,
        );
        results.success++;
      } catch (error) {
        results.failed.push({
          itemId: update.itemId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      if (onProgress) {
        onProgress(i + 1, updates.length);
      }
    }

    return results;
  }

  async createInventoryItem(fields: Record<string, any>): Promise<void> {
    const res = await fetch(`${API_URLS.inventoryList}/items`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.graphToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async updateInventoryItem(
    itemId: string,
    fields: Record<string, any>,
  ): Promise<void> {
    const res = await fetch(
      `${API_URLS.inventoryList}/items/${itemId}/fields`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.graphToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fields),
      },
    );
    if (!res.ok) throw new Error(await res.text());
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(API_URLS.sites, {
        headers: { Authorization: `Bearer ${this.graphToken}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getAllMembers(): Promise<User[]> {
    try {
      const url = `${API_URLS.memberList}/items?$expand=fields($select=*)&$top=999`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.graphToken}`,
          Prefer: "HonorNonIndexedQueriesWarningMayFailOverTime",
          ConsistencyLevel: "eventual",
        },
      });

      if (!response.ok) {
        console.error("❌ Failed to fetch members");
        return [];
      }

      const data = await response.json();
      if (data.value && data.value.length > 0) {
        return data.value.map((item: any) => ({
          id: item.id,
          Name: item.fields?.Name || item.fields?.Title || "",
          UserEmail: item.fields?.UserEmail || "",
          AliasEmail: item.fields?.AliasEmail || "",
          UserRole: (item.fields?.Role as UserRole) || "User",
          AccountStatus: item.fields?.AccountStatus || "Active",
          AccountCreateDate: item.fields?.AccountCreateDate || "",
        }));
      }
      return [];
    } catch (error) {
      console.error("❌ Error fetching members:", error);
      return [];
    }
  }

  async updateMemberRole(itemId: string, newRole: UserRole): Promise<boolean> {
    try {
      const url = `${API_URLS.memberList}/items/${itemId}/fields`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.graphToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Role: newRole }),
      });

      if (response.ok) {
        console.log(`✅ Member role updated to ${newRole}`);
        return true;
      } else {
        const errorDetail = await response.json();
        console.error("❌ Failed to update role:", errorDetail.error?.message);
        return false;
      }
    } catch (error) {
      console.error("❌ Error updating member role:", error);
      return false;
    }
  }

  async updateMemberStatus(
    itemId: string,
    status: "Active" | "Inactive",
  ): Promise<boolean> {
    try {
      const url = `${API_URLS.memberList}/items/${itemId}/fields`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.graphToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ AccountStatus: status }),
      });

      if (response.ok) {
        console.log(`✅ Member status updated to ${status}`);
        return true;
      } else {
        const errorDetail = await response.json();
        console.error(
          "❌ Failed to update status:",
          errorDetail.error?.message,
        );
        return false;
      }
    } catch (error) {
      console.error("❌ Error updating member status:", error);
      return false;
    }
  }

  async getTimeCardEntries(): Promise<TimeCardEntry[]> {
    const url = `${API_URLS.timeCardList}/items?$expand=fields($select=FEName,ActionTime,Action,ShopName,Role)&$top=999&$orderby=fields/ActionTime desc`;
    const entries: TimeCardEntry[] = [];
    let nextLink: string | undefined = url;

    while (nextLink) {
      const response = await fetch(nextLink, {
        headers: {
          Authorization: `Bearer ${this.graphToken}`,
          Prefer: "HonorNonIndexedQueriesWarningMayFailOverTime",
          ConsistencyLevel: "eventual",
        },
      });
      if (!response.ok) break;
      const data = await response.json();
      (data.value || []).forEach((item: any) => {
        const f = item.fields;
        entries.push({
          id: item.id,
          feName: f.FEName || "",
          actionTime: f.ActionTime || "",
          action: f.Action || "Check In",
          shopName: f.ShopName || "",
          role: f.Role || "Main",
        });
      });
      nextLink = data["@odata.nextLink"];
    }
    return entries;
  }
}

export default SharePointService;
export type { SaveSchedulePayload, BatchUpdatePayload };
