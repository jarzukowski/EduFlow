import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { apiClient } from '@/api/axios';
import { getApiErrorMessage } from '@/api/apiError';
import {
  parseAdminCoursesResponse,
  parseAdminStatsDTO,
  parseAdminUsersResponse,
  parseSendAdminMessageResponseDTO,
  parseSendAdminNotificationResponseDTO,
} from '@/api/contracts/admin.contracts';

import type {
  AdminCourseDTO,
  AdminMessageRole,
  AdminMessageRoleMode,
  AdminMessageTarget,
  AdminNotificationTarget,
  AdminStatsDTO,
  AdminUserDTO,
  AdminUserStatus,
  ChangeUserRolePayload,
  ChangeUserRoleResponseDTO,
  ForceLogoutUserResponseDTO,
  SendAdminMessagePayload,
  SendAdminNotificationPayload,
  UserRole,
} from '@/types/admin.types';

type UsersFilters = {
  search: string;
  role: UserRole | 'ALL';
  status: AdminUserStatus | 'ALL';
  lastLoginFrom: string;
  lastLoginTo: string;
  page: number;
  limit: number;
};

type CoursesFilters = {
  search: string;
  page: number;
  limit: number;
};

type AdminNotificationFormViewModel = {
  target: AdminNotificationTarget;
  role: UserRole;
  userId: string;
  title: string;
  message: string;
  href: string;
};

type AdminMessageFormViewModel = {
  target: AdminMessageTarget;
  role: AdminMessageRole;
  mode: AdminMessageRoleMode;
  userId: string;
  body: string;
};

const MAX_PAGE = 10_000;
const MAX_LIMIT = 50;

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const setQueryParamIfPresent = (
  params: URLSearchParams,
  key: string,
  value: string | null | undefined,
): void => {
  if (!value) {
    return;
  }

  params.set(key, value);
};

const normalizeTrimmedValue = (value: string): string => value.trim();

const toIsoFromDateInput = (value: string): string | null => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const milliseconds = Date.parse(trimmedValue);

  if (!Number.isFinite(milliseconds)) {
    return null;
  }

  const date = new Date(milliseconds);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

const createInitialUsersFilters = (): UsersFilters => ({
  search: '',
  role: 'ALL',
  status: 'ALL',
  lastLoginFrom: '',
  lastLoginTo: '',
  page: 1,
  limit: 20,
});

const createInitialCoursesFilters = (): CoursesFilters => ({
  search: '',
  page: 1,
  limit: 20,
});

const createInitialNotificationForm =
  (): AdminNotificationFormViewModel => ({
    target: 'ALL',
    role: 'STUDENT',
    userId: '',
    title: '',
    message: '',
    href: '',
  });

const createInitialMessageForm = (): AdminMessageFormViewModel => ({
  target: 'ALL',
  role: 'STUDENT',
  mode: 'ALL',
  userId: '',
  body: '',
});

export const useAdminStore = defineStore('admin', () => {
  const stats = ref<AdminStatsDTO | null>(null);
  const statsLoading = ref<boolean>(false);
  const statsError = ref<string | null>(null);

  const users = ref<AdminUserDTO[]>([]);
  const usersTotal = ref<number>(0);
  const usersLoading = ref<boolean>(false);
  const usersError = ref<string | null>(null);
  const usersFilters = ref<UsersFilters>(createInitialUsersFilters());

  const courses = ref<AdminCourseDTO[]>([]);
  const coursesTotal = ref<number>(0);
  const coursesLoading = ref<boolean>(false);
  const coursesError = ref<string | null>(null);
  const coursesFilters = ref<CoursesFilters>(createInitialCoursesFilters());

  const notificationForm = ref<AdminNotificationFormViewModel>(
    createInitialNotificationForm(),
  );
  const notificationBusy = ref<boolean>(false);
  const notificationError = ref<string | null>(null);
  const notificationOk = ref<string | null>(null);

  const messageForm = ref<AdminMessageFormViewModel>(createInitialMessageForm());
  const messageBusy = ref<boolean>(false);
  const messageError = ref<string | null>(null);
  const messageOk = ref<string | null>(null);

  const roleChangeBusyByUserId = ref<Record<string, boolean>>({});
  const forceLogoutBusyByUserId = ref<Record<string, boolean>>({});
  const lastActionOk = ref<string | null>(null);

  let usersRequestSequence = 0;
  let coursesRequestSequence = 0;

  const clearStatsError = (): void => {
    statsError.value = null;
  };

  const clearUsersError = (): void => {
    usersError.value = null;
  };

  const clearCoursesError = (): void => {
    coursesError.value = null;
  };

  const clearNotificationState = (): void => {
    notificationError.value = null;
    notificationOk.value = null;
  };

  const clearMessageState = (): void => {
    messageError.value = null;
    messageOk.value = null;
  };

  const clearLastActionOk = (): void => {
    lastActionOk.value = null;
  };

  const usersHasMore = computed<boolean>(() => {
    const totalPages = Math.ceil(usersTotal.value / usersFilters.value.limit);
    return usersFilters.value.page < Math.max(1, totalPages);
  });

  const coursesHasMore = computed<boolean>(() => {
    const totalPages = Math.ceil(coursesTotal.value / coursesFilters.value.limit);
    return coursesFilters.value.page < Math.max(1, totalPages);
  });

  const buildUsersParams = (): URLSearchParams => {
    const params = new URLSearchParams();

    params.set('page', String(usersFilters.value.page));
    params.set('limit', String(usersFilters.value.limit));

    const trimmedSearch = usersFilters.value.search.trim();

    if (trimmedSearch.length >= 2) {
      setQueryParamIfPresent(params, 'search', trimmedSearch);
    }

    if (usersFilters.value.role !== 'ALL') {
      setQueryParamIfPresent(params, 'role', usersFilters.value.role);
    }

    if (usersFilters.value.status !== 'ALL') {
      setQueryParamIfPresent(params, 'status', usersFilters.value.status);
    }

    setQueryParamIfPresent(
      params,
      'lastLoginFrom',
      toIsoFromDateInput(usersFilters.value.lastLoginFrom),
    );

    setQueryParamIfPresent(
      params,
      'lastLoginTo',
      toIsoFromDateInput(usersFilters.value.lastLoginTo),
    );

    return params;
  };

  const buildCoursesParams = (): URLSearchParams => {
    const params = new URLSearchParams();

    params.set('page', String(coursesFilters.value.page));
    params.set('limit', String(coursesFilters.value.limit));

    const trimmedSearch = coursesFilters.value.search.trim();

    if (trimmedSearch.length >= 2) {
      setQueryParamIfPresent(params, 'search', trimmedSearch);
    }

    return params;
  };

  const buildSendNotificationPayload =
    (): SendAdminNotificationPayload => {
      const title = normalizeTrimmedValue(notificationForm.value.title);
      const message = normalizeTrimmedValue(notificationForm.value.message);
      const href = normalizeTrimmedValue(notificationForm.value.href);

      if (notificationForm.value.target === 'ALL') {
        return {
          target: 'ALL',
          title,
          message,
          ...(href ? { href } : {}),
        };
      }

      if (notificationForm.value.target === 'ROLE') {
        return {
          target: 'ROLE',
          role: notificationForm.value.role,
          title,
          message,
          ...(href ? { href } : {}),
        };
      }

      return {
        target: 'USER',
        userId: normalizeTrimmedValue(notificationForm.value.userId),
        title,
        message,
        ...(href ? { href } : {}),
      };
    };

  const buildSendMessagePayload = (): SendAdminMessagePayload => {
    const body = normalizeTrimmedValue(messageForm.value.body);

    if (messageForm.value.target === 'ALL') {
      return {
        target: 'ALL',
        body,
      };
    }

    if (messageForm.value.target === 'USER') {
      return {
        target: 'USER',
        userId: normalizeTrimmedValue(messageForm.value.userId),
        body,
      };
    }

    if (messageForm.value.mode === 'ALL') {
      return {
        target: 'ROLE',
        role: messageForm.value.role,
        mode: 'ALL',
        body,
      };
    }

    return {
      target: 'ROLE',
      role: messageForm.value.role,
      mode: 'USER',
      userId: normalizeTrimmedValue(messageForm.value.userId),
      body,
    };
  };

  const fetchStats = async (): Promise<void> => {
    if (statsLoading.value) {
      return;
    }

    statsLoading.value = true;
    clearStatsError();

    try {
      const response = await apiClient.get<unknown>('/admin/stats');
      stats.value = parseAdminStatsDTO(response.data);
    } catch (error) {
      statsError.value = getApiErrorMessage(
        error,
        'Failed to load statistics.',
      );
      stats.value = null;
    } finally {
      statsLoading.value = false;
    }
  };

  const fetchUsers = async (): Promise<void> => {
    if (usersLoading.value) {
      return;
    }

    usersLoading.value = true;
    clearUsersError();

    const requestId = ++usersRequestSequence;

    try {
      const params = buildUsersParams();
      const response = await apiClient.get<unknown>(
        `/admin/users?${params.toString()}`,
      );
      const parsedResponse = parseAdminUsersResponse(response.data);

      if (requestId !== usersRequestSequence) {
        return;
      }

      users.value = parsedResponse.items;
      usersTotal.value = parsedResponse.total;
      usersFilters.value.page = parsedResponse.page;
      usersFilters.value.limit = parsedResponse.limit;
    } catch (error) {
      if (requestId !== usersRequestSequence) {
        return;
      }

      usersError.value = getApiErrorMessage(
        error,
        'Failed to load users.',
      );
      users.value = [];
      usersTotal.value = 0;
    } finally {
      if (requestId === usersRequestSequence) {
        usersLoading.value = false;
      }
    }
  };

  const fetchCourses = async (): Promise<void> => {
    if (coursesLoading.value) {
      return;
    }

    coursesLoading.value = true;
    clearCoursesError();

    const requestId = ++coursesRequestSequence;

    try {
      const params = buildCoursesParams();
      const response = await apiClient.get<unknown>(
        `/admin/courses?${params.toString()}`,
      );
      const parsedResponse = parseAdminCoursesResponse(response.data);

      if (requestId !== coursesRequestSequence) {
        return;
      }

      courses.value = parsedResponse.items;
      coursesTotal.value = parsedResponse.total;
      coursesFilters.value.page = parsedResponse.page;
      coursesFilters.value.limit = parsedResponse.limit;
    } catch (error) {
      if (requestId !== coursesRequestSequence) {
        return;
      }

      coursesError.value = getApiErrorMessage(
        error,
        'Failed to load courses.',
      );
      courses.value = [];
      coursesTotal.value = 0;
    } finally {
      if (requestId === coursesRequestSequence) {
        coursesLoading.value = false;
      }
    }
  };

  const setUsersSearch = (value: string): void => {
    usersFilters.value.search = value;
    usersFilters.value.page = 1;
  };

  const setUsersRole = (value: UsersFilters['role']): void => {
    usersFilters.value.role = value;
    usersFilters.value.page = 1;
  };

  const setUsersStatus = (value: UsersFilters['status']): void => {
    usersFilters.value.status = value;
    usersFilters.value.page = 1;
  };

  const setUsersLastLoginFrom = (value: string): void => {
    usersFilters.value.lastLoginFrom = value;
    usersFilters.value.page = 1;
  };

  const setUsersLastLoginTo = (value: string): void => {
    usersFilters.value.lastLoginTo = value;
    usersFilters.value.page = 1;
  };

  const setUsersPage = (page: number): void => {
    usersFilters.value.page = clampNumber(page, 1, MAX_PAGE);
  };

  const setUsersLimit = (limit: number): void => {
    usersFilters.value.limit = clampNumber(limit, 1, MAX_LIMIT);
    usersFilters.value.page = 1;
  };

  const setCoursesSearch = (value: string): void => {
    coursesFilters.value.search = value;
    coursesFilters.value.page = 1;
  };

  const setCoursesPage = (page: number): void => {
    coursesFilters.value.page = clampNumber(page, 1, MAX_PAGE);
  };

  const setCoursesLimit = (limit: number): void => {
    coursesFilters.value.limit = clampNumber(limit, 1, MAX_LIMIT);
    coursesFilters.value.page = 1;
  };

  const setNotificationTarget = (
    value: AdminNotificationTarget,
  ): void => {
    notificationForm.value.target = value;
    clearNotificationState();

    if (value !== 'ROLE') {
      notificationForm.value.role = 'STUDENT';
    }

    if (value !== 'USER') {
      notificationForm.value.userId = '';
    }
  };

  const setNotificationRole = (value: UserRole): void => {
    notificationForm.value.role = value;
    notificationOk.value = null;
  };

  const setNotificationUserId = (value: string): void => {
    notificationForm.value.userId = value;
    notificationOk.value = null;
  };

  const setNotificationTitle = (value: string): void => {
    notificationForm.value.title = value;
    notificationOk.value = null;
  };

  const setNotificationMessage = (value: string): void => {
    notificationForm.value.message = value;
    notificationOk.value = null;
  };

  const setNotificationHref = (value: string): void => {
    notificationForm.value.href = value;
    notificationOk.value = null;
  };

  const sendNotification = async (): Promise<void> => {
    if (notificationBusy.value) {
      return;
    }

    notificationBusy.value = true;
    notificationError.value = null;
    notificationOk.value = null;

    try {
      const payload = buildSendNotificationPayload();

      const response = await apiClient.post<unknown>(
        '/admin/notifications',
        payload,
      );
      const parsedResponse = parseSendAdminNotificationResponseDTO(response.data);

      notificationOk.value = `Notifications sent: ${parsedResponse.createdCount}.`;
      notificationForm.value = createInitialNotificationForm();
    } catch (error) {
      notificationError.value = getApiErrorMessage(
        error,
        'Failed to send notification.',
      );
    } finally {
      notificationBusy.value = false;
    }
  };

  const setMessageTarget = (value: AdminMessageTarget): void => {
    messageForm.value.target = value;
    clearMessageState();

    if (value !== 'ROLE') {
      messageForm.value.role = 'STUDENT';
      messageForm.value.mode = 'ALL';
    }

    if (value !== 'USER') {
      messageForm.value.userId = '';
    }
  };

  const setMessageRole = (value: AdminMessageRole): void => {
    messageForm.value.role = value;
    messageOk.value = null;
  };

  const setMessageMode = (value: AdminMessageRoleMode): void => {
    messageForm.value.mode = value;
    messageOk.value = null;

    if (value !== 'USER') {
      messageForm.value.userId = '';
    }
  };

  const setMessageUserId = (value: string): void => {
    messageForm.value.userId = value;
    messageOk.value = null;
  };

  const setMessageBody = (value: string): void => {
    messageForm.value.body = value;
    messageOk.value = null;
  };

  const sendMessage = async (): Promise<void> => {
    if (messageBusy.value) {
      return;
    }

    messageBusy.value = true;
    messageError.value = null;
    messageOk.value = null;

    try {
      const payload = buildSendMessagePayload();

      const response = await apiClient.post<unknown>(
        '/admin/messages',
        payload,
      );
      const parsedResponse = parseSendAdminMessageResponseDTO(response.data);

      messageOk.value = `Message sent to ${parsedResponse.sentCount} users.`;
      messageForm.value = {
        ...messageForm.value,
        userId: '',
        body: '',
      };
    } catch (error) {
      messageError.value = getApiErrorMessage(
        error,
        'Failed to send message.',
      );
    } finally {
      messageBusy.value = false;
    }
  };

  const isRoleChangeBusy = (userId: string): boolean =>
    Boolean(roleChangeBusyByUserId.value[userId]);

  const isForceLogoutBusy = (userId: string): boolean =>
    Boolean(forceLogoutBusyByUserId.value[userId]);

  const changeUserRole = async (
    userId: string,
    role: UserRole,
  ): Promise<void> => {
    if (isRoleChangeBusy(userId)) {
      return;
    }

    roleChangeBusyByUserId.value = {
      ...roleChangeBusyByUserId.value,
      [userId]: true,
    };

    lastActionOk.value = null;
    clearUsersError();

    try {
      const payload: ChangeUserRolePayload = { role };

      await apiClient.patch<ChangeUserRoleResponseDTO>(
        `/admin/users/${userId}/role`,
        payload,
      );

      await fetchUsers();
      lastActionOk.value = 'User role updated.';
    } catch (error) {
      usersError.value = getApiErrorMessage(
        error,
        'Failed to change the user role.',
      );
    } finally {
      const nextBusyByUserId = { ...roleChangeBusyByUserId.value };
      delete nextBusyByUserId[userId];
      roleChangeBusyByUserId.value = nextBusyByUserId;
    }
  };

  const forceLogoutUser = async (userId: string): Promise<void> => {
    if (isForceLogoutBusy(userId)) {
      return;
    }

    forceLogoutBusyByUserId.value = {
      ...forceLogoutBusyByUserId.value,
      [userId]: true,
    };

    lastActionOk.value = null;
    clearUsersError();

    try {
      await apiClient.post<ForceLogoutUserResponseDTO>(
        `/admin/users/${userId}/force-logout`,
      );

      await fetchUsers();
      lastActionOk.value = 'User signed out from all sessions.';
    } catch (error) {
      usersError.value = getApiErrorMessage(
        error,
        'Failed to sign out the user.',
      );
    } finally {
      const nextBusyByUserId = { ...forceLogoutBusyByUserId.value };
      delete nextBusyByUserId[userId];
      forceLogoutBusyByUserId.value = nextBusyByUserId;
    }
  };

  return {
    stats,
    statsLoading,
    statsError,
    clearStatsError,
    fetchStats,

    users,
    usersTotal,
    usersLoading,
    usersError,
    clearUsersError,
    usersFilters,
    usersHasMore,
    fetchUsers,
    setUsersSearch,
    setUsersRole,
    setUsersStatus,
    setUsersLastLoginFrom,
    setUsersLastLoginTo,
    setUsersPage,
    setUsersLimit,

    courses,
    coursesTotal,
    coursesLoading,
    coursesError,
    clearCoursesError,
    coursesFilters,
    coursesHasMore,
    fetchCourses,
    setCoursesSearch,
    setCoursesPage,
    setCoursesLimit,

    notificationForm,
    notificationBusy,
    notificationError,
    notificationOk,
    clearNotificationState,
    setNotificationTarget,
    setNotificationRole,
    setNotificationUserId,
    setNotificationTitle,
    setNotificationMessage,
    setNotificationHref,
    sendNotification,

    messageForm,
    messageBusy,
    messageError,
    messageOk,
    clearMessageState,
    setMessageTarget,
    setMessageRole,
    setMessageMode,
    setMessageUserId,
    setMessageBody,
    sendMessage,

    roleChangeBusyByUserId,
    forceLogoutBusyByUserId,
    isRoleChangeBusy,
    isForceLogoutBusy,
    changeUserRole,
    forceLogoutUser,
    lastActionOk,
    clearLastActionOk,
  };
});


