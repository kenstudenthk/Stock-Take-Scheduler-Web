// 测试 Microsoft Graph Token 自动刷新配置
// 运行方式：node test-token.js

const CLIENT_ID = 'db684a8a-bc13-4250-bff1-dfb7dc55d568';
const CLIENT_SECRET = '4BK8Q~Bk4QU.8DDQ5Eq66ZBxeiXV6a41QlZe4dlm';
const TENANT_ID = 'c5924da6-deb3-421b-aa98-57bcba0ba050';

async function testTokenRefresh() {
  console.log('🔄 开始测试 Token 配置...\n');
  
  console.log('配置信息:');
  console.log('  Client ID:', CLIENT_ID);
  console.log('  Secret Value:', CLIENT_SECRET.substring(0, 10) + '...');
  console.log('  Tenant ID:', TENANT_ID);
  console.log('\n正在请求 Token...\n');

  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials'
        })
      }
    );

    const data = await response.json();

    if (data.access_token) {
      console.log('✅ 成功！Token 获取成功！\n');
      console.log('Token 信息:');
      console.log('  Token (前50字符):', data.access_token.substring(0, 50) + '...');
      console.log('  Token 类型:', data.token_type);
      console.log('  有效期:', data.expires_in, '秒 (约', Math.floor(data.expires_in / 60), '分钟)');
      console.log('  范围:', data.scope || 'N/A');
      console.log('\n✅ 配置正确！可以开始使用自动刷新功能。');
      console.log('\n下一步：');
      console.log('1. 确保 .env 文件在项目根目录');
      console.log('2. 重启开发服务器: npm run dev');
      console.log('3. 在 Settings 页面查看自动刷新状态');
      
      return true;
    } else {
      console.log('❌ 失败！无法获取 Token\n');
      console.log('错误信息:');
      console.log('  错误代码:', data.error);
      console.log('  错误描述:', data.error_description);
      console.log('\n可能的原因:');
      console.log('  1. Client Secret 不正确（是否复制了 Value？）');
      console.log('  2. Client ID 或 Tenant ID 不正确');
      console.log('  3. App 权限未配置（需要 Microsoft Graph API 权限）');
      console.log('  4. App 未获得管理员同意');
      
      return false;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    console.log('\n可能的原因:');
    console.log('  1. 网络连接问题');
    console.log('  2. Tenant ID 格式不正确');
    return false;
  }
}

// 测试调用 Microsoft Graph API
async function testGraphAPI(token) {
  console.log('\n\n🧪 测试 Graph API 调用...\n');
  
  try {
    const response = await fetch(
      'https://graph.microsoft.com/v1.0/users?$top=1',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Graph API 调用成功！');
      console.log('  返回用户数:', data.value?.length || 0);
      if (data.value && data.value.length > 0) {
        console.log('  示例用户:', data.value[0].displayName || data.value[0].userPrincipalName);
      }
    } else {
      const error = await response.json();
      console.log('⚠️ Graph API 调用失败');
      console.log('  状态码:', response.status);
      console.log('  错误:', error.error?.message || 'Unknown error');
      console.log('\n可能需要配置以下权限:');
      console.log('  - User.Read.All');
      console.log('  - Sites.ReadWrite.All');
    }
  } catch (error) {
    console.error('❌ Graph API 测试失败:', error.message);
  }
}

// 运行测试
(async () => {
  const success = await testTokenRefresh();
  
  if (success) {
    // 如果获取 Token 成功，尝试调用 Graph API
    const response = await fetch(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials'
        })
      }
    );
    const data = await response.json();
    await testGraphAPI(data.access_token);
  }
})();
