import api from './api.js'
import type { Address, User } from '../types'

export function mapDbAddress(raw: Record<string, any>): Address {
  return {
    id: String(raw.id ?? ''),
    fullName: raw.recipient_name ?? raw.full_name ?? raw.name ?? '',
    phone: raw.phone ?? '',
    province: raw.province ?? raw.city ?? '',
    district: raw.district ?? '',
    ward: raw.ward ?? '',
    detailAddress: raw.street_address ?? raw.detail_address ?? raw.street ?? raw.address ?? '',
    street: raw.street_address ?? raw.detail_address ?? raw.street ?? raw.address ?? '',
    isDefault: Boolean(raw.is_default ?? raw.isDefault ?? false),
    provinceId: raw.province_id ? Number(raw.province_id) : undefined,
    districtId: raw.district_id ? Number(raw.district_id) : undefined,
    wardCode: raw.ward_code ? String(raw.ward_code) : undefined,
    province_id: raw.province_id ? Number(raw.province_id) : undefined,
    district_id: raw.district_id ? Number(raw.district_id) : undefined,
    ward_code: raw.ward_code ? String(raw.ward_code) : undefined,
  }
}

export async function login(arg1: any, password?: string) {
  let payload: Record<string, any>
  if (typeof arg1 === 'string') {
    const isEmail = arg1.includes('@')
    payload = {
      login: arg1,
      email: isEmail ? arg1 : undefined,
      phone: !isEmail ? arg1 : undefined,
      password: password,
    }
  } else {
    payload = arg1
  }
  const response = await api.post('/auth/login', payload)
  return response.data
}

export async function register(arg1: any, arg2?: string, arg3?: string) {
  let payload: Record<string, any>
  if (typeof arg1 === 'string') {
    if (arg2 && arg2.includes('@')) {
      payload = {
        name: arg1,
        email: arg2,
        password: arg3,
      }
    } else {
      payload = {
        name: arg1,
        phone: arg2,
        password: arg3,
      }
    }
  } else {
    payload = arg1
  }
  const response = await api.post('/auth/register', payload)
  return response.data
}

export async function verifyEmail(email: string, otp: string) {
  const response = await api.post('/auth/verify-email', { email, otp })
  return response.data
}

export async function resendOtp(email: string) {
  const response = await api.post('/auth/resend-otp', { email })
  return response.data
}

export async function forgotPassword(email: string) {
  const response = await api.post('/auth/forgot-password', { email })
  return response.data
}

export async function fetchAddresses(userId?: string | number): Promise<Address[]> {
  const response = await api.get('/auth/addresses', { params: userId ? { user_id: userId } : {} })
  const list = response.data?.data ?? response.data ?? []
  return Array.isArray(list) ? list.map(mapDbAddress) : []
}

export async function createAddress(arg1: any, arg2?: Omit<Address, 'id'>): Promise<Address> {
  let userId: number | undefined
  let address: Omit<Address, 'id'> | any

  if (typeof arg1 === 'number' || (typeof arg1 === 'string' && !isNaN(Number(arg1)))) {
    userId = Number(arg1)
    address = arg2
  } else {
    address = arg1
    userId = address.user_id ? Number(address.user_id) : undefined
  }

  // Fallback lấy userId từ local storage nếu chưa truyền
  if (!userId) {
    try {
      const stored = localStorage.getItem('crs_user')
      if (stored) {
        const u = JSON.parse(stored)
        if (u?.id) userId = Number(u.id)
      }
    } catch {
      // ignore
    }
  }

  const payload = {
    user_id: userId,
    recipient_name: address.fullName ?? address.recipient_name ?? address.name ?? '',
    phone: address.phone ?? '',
    province: address.province ?? '',
    district: address.district ?? '',
    ward: address.ward ?? '',
    street_address: address.detailAddress ?? address.street ?? address.street_address ?? address.address ?? '',
    is_default: Boolean(address.isDefault ?? address.is_default ?? false),
    province_id: address.province_id || address.provinceId,
    district_id: address.district_id || address.districtId,
    ward_code: address.ward_code || address.wardCode,
  }

  const response = await api.post('/auth/addresses', payload)
  const mapped = mapDbAddress(response.data?.data ?? response.data)
  return {
    ...mapped,
    province_id: mapped.province_id || address.province_id || address.provinceId,
    district_id: mapped.district_id || address.district_id || address.districtId,
    ward_code: mapped.ward_code || address.ward_code || address.wardCode,
    provinceId: mapped.provinceId || address.provinceId || address.province_id,
    districtId: mapped.districtId || address.districtId || address.district_id,
    wardCode: mapped.wardCode || address.wardCode || address.ward_code,
  }
}

export async function deleteAddress(id: string): Promise<void> {
  await api.delete(`/auth/addresses/${id}`)
}

export async function setDefaultAddress(id: string): Promise<void> {
  await api.patch(`/auth/addresses/${id}/default`)
}

export async function updateProfile(data: Partial<User>): Promise<User> {
  const response = await api.patch('/auth/profile', data)
  return response.data?.data ?? response.data
}
