import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RequestJsonOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  accessToken?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
};

export type AuthMeNavigation = {
  auth: 'authenticated';
  has_person: boolean;
  has_household: boolean;
  has_active_household: boolean;
  membership_state: 'none' | 'pending' | 'active' | 'suspended' | string;
  next:
    | 'create_person_profile'
    | 'create_or_join_household'
    | 'pending_approval'
    | 'access_suspended'
    | 'select_household'
    | 'set_active_household'
    | 'repair_active_household'
    | 'household_onboarding'
    | 'home'
    | string;
};

export type AuthMeMembership = {
  id: string;
  household_id: string;
  person_id: string;
  role: 'coordinator' | 'adult' | 'adolescent' | 'child' | 'senior' | 'guest' | string | null;
  status: 'pending' | 'active' | 'suspended' | 'finalized' | string;
  joined_at: string | null;
  left_at: string | null;
  household_onboarding_status: 'not_started' | 'in_progress' | 'completed' | string;
  household_onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthMeHousehold = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  default_language: string;
  config: Record<string, unknown>;
  created_by_person_id: string;
  created_at: string;
  updated_at: string;
};

export type AuthMePerson = {
  id: string;
  auth_user_id: string | null;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  default_language: string;
  personal_settings: Record<string, unknown>;
  active_household_id: string | null;
  app_onboarding_status: 'not_started' | 'in_progress' | 'completed' | string;
  app_onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthMe = {
  user: unknown;
  person: AuthMePerson | null;
  memberships: AuthMeMembership[];
  active_household: AuthMeHousehold | null;
  navigation: AuthMeNavigation;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user?: unknown;
};

export type AuthRegisterPayload = {
  email: string;
  password: string;
  display_name: string;
};

export type AuthRegisterResponse = {
  user: unknown;
  person: AuthMePerson;
  session: AuthSession | null;
  requires_email_confirmation: boolean;
};

export type AuthLoginPayload = {
  email: string;
  password: string;
};

export type AuthLoginResponse = {
  user: unknown;
  person: AuthMePerson | null;
  session: AuthSession;
  me: AuthMe;
};

export type AuthLogoutResponse = {
  success: boolean;
};

export type CreateHouseholdPayload = {
  name: string;
};

export type CreateHouseholdResponse = {
  household: AuthMeHousehold;
  membership: AuthMeMembership;
  person: AuthMePerson;
  me: AuthMe;
};

export type InviteLink = {
  id: string;
  household_id: string;
  token: string;
  created_by_person_id?: string | null;
  revoked_at?: string | null;
  expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CreateInviteLinkResponse = {
  invite_link: InviteLink;
};

export type JoinByTokenResponse = {
  join_request: {
    result: 'pending_created' | 'pending_existing' | string;
    membership: AuthMeMembership;
  };
};

export type JoinRequest = AuthMeMembership;

export type ListJoinRequestsResponse = {
  join_requests: JoinRequest[];
};

export type MembershipResponse = {
  membership: AuthMeMembership;
};

export class ApiError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const getBearerHeaders = (accessToken?: string | null): Record<string, string> => {
  if (!accessToken) {
    return {};
  }

  return { Authorization: `Bearer ${accessToken}` };
};

const buildApiUrl = (path: string) => {
  if (!API_BASE_URL) {
    throw new ApiError('Falta EXPO_PUBLIC_API_URL para conectar con el backend.', 0, 'api_url_missing');
  }

  const base = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

const getResponseMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.error === 'string') return record.error;
  }

  return fallback;
};

const getResponseCode = (payload: unknown) => {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.code === 'string') return record.code;
  }

  return null;
};

export async function requestJson<T>(path: string, options: RequestJsonOptions = {}): Promise<T> {
  const { method = 'GET', accessToken, body, headers } = options;

  const response = await fetch(buildApiUrl(path), {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...getBearerHeaders(accessToken),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let payload: unknown = null;

  try {
    payload = text ? JSON.parse(text) as unknown : null;
  } catch {
    throw new ApiError('El backend devolvio una respuesta invalida.', response.status, 'invalid_json');
  }

  if (!response.ok) {
    throw new ApiError(
      getResponseMessage(payload, 'No pudimos completar la solicitud.'),
      response.status,
      getResponseCode(payload),
    );
  }

  return payload as T;
}

export const getAuthMe = (accessToken: string) =>
  requestJson<AuthMe>('/api/auth/me', { accessToken });

export const authRegister = (payload: AuthRegisterPayload) =>
  requestJson<AuthRegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: payload,
  });

export const authLogin = (payload: AuthLoginPayload) =>
  requestJson<AuthLoginResponse>('/api/auth/login', {
    method: 'POST',
    body: payload,
  });

export const authLogout = (accessToken?: string | null) =>
  requestJson<AuthLogoutResponse>('/api/auth/logout', {
    method: 'POST',
    accessToken,
  });

export const createHousehold = (accessToken: string, payload: CreateHouseholdPayload) =>
  requestJson<CreateHouseholdResponse>('/api/households', {
    method: 'POST',
    accessToken,
    body: payload,
  });

export const createInviteLink = (accessToken: string, householdId: string) =>
  requestJson<CreateInviteLinkResponse>(`/api/households/${householdId}/invite-links`, {
    method: 'POST',
    accessToken,
  });

export const revokeInviteLink = (
  accessToken: string,
  householdId: string,
  inviteLinkId: string,
) =>
  requestJson<CreateInviteLinkResponse>(
    `/api/households/${householdId}/invite-links/${inviteLinkId}/revoke`,
    {
      method: 'POST',
      accessToken,
    },
  );

export const joinByToken = (accessToken: string, token: string) =>
  requestJson<JoinByTokenResponse>('/api/invite-links/join', {
    method: 'POST',
    accessToken,
    body: { token },
  });

export const listJoinRequests = (accessToken: string, householdId: string) =>
  requestJson<ListJoinRequestsResponse>(`/api/households/${householdId}/join-requests`, {
    accessToken,
  });

export const approveJoinRequest = (
  accessToken: string,
  householdId: string,
  membershipId: string,
  role: string,
) =>
  requestJson<MembershipResponse>(
    `/api/households/${householdId}/join-requests/${membershipId}/approve`,
    {
      method: 'POST',
      accessToken,
      body: { role },
    },
  );

export const rejectJoinRequest = (
  accessToken: string,
  householdId: string,
  membershipId: string,
) =>
  requestJson<MembershipResponse>(
    `/api/households/${householdId}/join-requests/${membershipId}/reject`,
    {
      method: 'POST',
      accessToken,
    },
  );

export const finalizeHouseholdMember = (
  accessToken: string,
  householdId: string,
  membershipId: string,
) =>
  requestJson<MembershipResponse>(
    `/api/households/${householdId}/members/${membershipId}/finalize`,
    {
      method: 'POST',
      accessToken,
    },
  );
