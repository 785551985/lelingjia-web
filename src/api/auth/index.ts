import type { EmailCodeDTO, LoginDTO, LoginResponse, RegisterDTO } from './types';
import { get, post } from '@/utils/request';

export const login = (data: LoginDTO) => post<LoginResponse>('/auth/login', data).json();

// 邮箱验证码
export const emailCode = (data: EmailCodeDTO) => post('/resource/email/code', data).json();

// 注册账号
export const register = (data: RegisterDTO) => post('/auth/register', data).json();

// 获取当前登录用户信息
export const getUserInfo = () => get('/system/user/getInfo').json();

// 获取租户/企业列表
export const getTenantList = () => get<{ tenantEnabled?: boolean; voList?: Array<{ tenantId: string; companyName: string }> }>('/auth/tenant/list').json();
