type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

type ClientOptions = {
  getAccessToken?: () => string | null;
};

const fieldLabelMap: Record<string, string> = {
  non_field_errors: "Thông tin",
  detail: "Chi tiết",
  full_name: "Họ và tên",
  email: "Email",
  phone: "Số điện thoại",
  password: "Mật khẩu",
  confirm_password: "Xác nhận mật khẩu",
  preferred_language: "Ngôn ngữ"
};

const getFieldLabel = (field: string) => fieldLabelMap[field] ?? field.replace(/_/g, " ");

const extractErrorMessage = (payload: unknown): string | null => {
  if (!payload) {
    return null;
  }

  if (typeof payload === "string") {
    return payload.trim() || null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const message = extractErrorMessage(item);
      if (message) {
        return message;
      }
    }
    return null;
  }

  if (typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  const directMessage = extractErrorMessage(record.message) ?? extractErrorMessage(record.detail);
  if (directMessage) {
    return directMessage;
  }

  for (const [field, value] of Object.entries(record)) {
    if (field === "success" || field === "data" || field === "message" || field === "details") {
      continue;
    }

    const message = extractErrorMessage(value);
    if (message) {
      return `${getFieldLabel(field)}: ${message}`;
    }
  }

  return extractErrorMessage(record.details);
};

export const createHttpClient = (baseUrl: string, options?: ClientOptions) => {
  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const token = options?.getAccessToken?.();
    let response: Response;

    try {
      response = await fetch(`${baseUrl}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init?.headers ?? {})
        },
        ...init
      });
    } catch {
      throw new ApiError("Không thể kết nối tới hệ thống. Hãy kiểm tra máy chủ và thử lại.", 0);
    }

    const rawPayload = await response.text();
    let payload: ApiEnvelope<T> | T | Record<string, unknown> | null = null;

    if (rawPayload) {
      try {
        payload = JSON.parse(rawPayload) as ApiEnvelope<T> | T | Record<string, unknown>;
      } catch {
        payload = null;
      }
    }

    const envelope = payload as ApiEnvelope<T> | null;
    if (!response.ok || envelope?.success === false) {
      throw new ApiError(
        extractErrorMessage(payload) ??
          (response.status >= 500
            ? "Hệ thống đang gặp lỗi máy chủ. Hãy thử lại sau."
            : "Đã xảy ra lỗi hệ thống."),
        response.status
      );
    }

    if (envelope && typeof envelope === "object" && "data" in envelope) {
      return envelope.data;
    }

    return payload as T;
  };

  return { request };
};
