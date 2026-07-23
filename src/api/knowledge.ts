// 知识库实体与查询接口类型定义
export interface KnowledgeInfoVO {
  id?: number;
  name: string;
  tenantId?: string;
  tenantName?: string;
  deptId?: string;
  deptName?: string;
  scopeLevel?: number;
  type?: string;
  describe?: string;
  totalSourceCount?: number;
  createTime?: string;
}

const BASE_API = import.meta.env.VITE_APP_BASE_API || '/dev-api';

async function customFetch<T>(url: string, options: RequestInit = {}): Promise<T | null> {
  const token = localStorage.getItem('Admin-Token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json;charset=utf-8',
    ...(options.headers as Record<string, string> || {})
  };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  try {
    const res = await fetch(`${BASE_API}${url}`, {
      ...options,
      headers
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch (err) {
    return null;
  }
}

/**
 * 1. 查询知识库分页列表
 */
export function getKnowledgeList(params?: Record<string, any>): Promise<any> {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  return customFetch(`/system/info/list${queryString}`);
}

/**
 * 2. 获取单知识库详情
 */
export function getKnowledgeDetail(id: number): Promise<any> {
  return customFetch(`/system/info/${id}`);
}

/**
 * 3. 新增知识库
 */
export function addKnowledge(data: KnowledgeInfoVO): Promise<any> {
  return customFetch('/system/info', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * 4. 修改知识库
 */
export function updateKnowledge(data: KnowledgeInfoVO): Promise<any> {
  return customFetch('/system/info', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * 5. 删除知识库
 */
export function deleteKnowledge(id: number): Promise<any> {
  return customFetch(`/system/info/${id}`, {
    method: 'DELETE'
  });
}

/**
 * 6. 向量检索测试
 */
export function searchKnowledgeFragments(data: Record<string, any>): Promise<any> {
  return customFetch('/system/fragment/retrieval', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
