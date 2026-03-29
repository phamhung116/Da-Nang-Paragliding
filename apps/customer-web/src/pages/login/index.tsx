import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Field, Input, Panel } from "@paragliding/ui";
import type { LoginPayload, RegisterPayload } from "@paragliding/api-client";
import { useAuth } from "@/app/providers/auth-provider";
import { useI18n } from "@/app/providers/i18n-provider";
import { routes } from "@/shared/config/routes";

type Mode = "login" | "register";

type RegisterFormValues = RegisterPayload & {
  confirm_password: string;
  agree_terms: boolean;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const normalizeFullName = (value: string) => value.trim().replace(/\s+/g, " ");
const normalizeEmail = (value: string) => value.trim().toLowerCase();

const normalizePhone = (value: string) => {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
};

const isValidPhone = (value: string) => {
  const digits = normalizePhone(value).replace("+", "");
  return digits.length >= 9 && digits.length <= 15;
};

const buildAuthHref = (mode: Mode, redirectTo: string) =>
  `${mode === "login" ? routes.login : routes.register}?redirect=${encodeURIComponent(redirectTo)}`;

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale, setLocale } = useI18n();
  const { login, register, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const mode: Mode = location.pathname === routes.register ? "register" : "login";
  const redirectTo = new URLSearchParams(location.search).get("redirect") ?? routes.home;

  const loginForm = useForm<LoginPayload>({
    defaultValues: {
      email: "",
      password: ""
    },
    mode: "all",
    reValidateMode: "onChange"
  });

  const registerForm = useForm<RegisterFormValues>({
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
      preferred_language: locale,
      agree_terms: false
    },
    mode: "all",
    reValidateMode: "onChange"
  });

  useEffect(() => {
    registerForm.setValue("preferred_language", locale);
  }, [locale, registerForm]);

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) =>
      login({
        ...payload,
        email: normalizeEmail(payload.email)
      }),
    onSuccess: () => navigate(redirectTo, { replace: true })
  });

  const registerMutation = useMutation({
    mutationFn: ({ confirm_password: _, agree_terms: __, ...payload }: RegisterFormValues) =>
      register({
        ...payload,
        full_name: normalizeFullName(payload.full_name),
        email: normalizeEmail(payload.email),
        phone: normalizePhone(payload.phone),
        preferred_language: locale
      }),
    onSuccess: () => navigate(redirectTo, { replace: true })
  });

  useEffect(() => {
    loginMutation.reset();
    registerMutation.reset();
    loginForm.reset({ email: "", password: "" });
    registerForm.reset({
      full_name: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
      preferred_language: locale,
      agree_terms: false
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [locale, loginForm, mode, registerForm]);

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const loginError = loginMutation.error instanceof Error ? loginMutation.error.message : null;
  const registerError = registerMutation.error instanceof Error ? registerMutation.error.message : null;

  return (
    <div className="auth-screen">
      <div className="auth-screen__glow auth-screen__glow--left" />
      <div className="auth-screen__glow auth-screen__glow--right" />
      <div className="auth-screen__shell">
        <div className="auth-screen__topbar">
          <Link to={routes.home} className="auth-screen__brand">
            <span className="auth-screen__brand-icon">SN</span>
            <span className="auth-screen__brand-copy">
              <strong>SkyNest</strong>
              <small>Da Nang Paragliding</small>
            </span>
          </Link>

          <div className="auth-screen__actions">
            <div className="locale-switcher">
              <button
                type="button"
                className={locale === "vi" ? "is-active" : ""}
                onClick={() => setLocale("vi")}
              >
                VI
              </button>
              <button
                type="button"
                className={locale === "en" ? "is-active" : ""}
                onClick={() => setLocale("en")}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        <Card className="auth-luxe-card">
          <Panel className="auth-luxe-panel">
            <div className="auth-luxe-switch">
              <Link className="auth-luxe-switch__item" to={buildAuthHref("login", redirectTo)}>
                <button
                  type="button"
                  className={`auth-luxe-switch__button ${mode === "login" ? "is-active" : ""}`}
                >
                  Dang nhap
                </button>
              </Link>
              <Link className="auth-luxe-switch__item" to={buildAuthHref("register", redirectTo)}>
                <button
                  type="button"
                  className={`auth-luxe-switch__button ${mode === "register" ? "is-active" : ""}`}
                >
                  Dang ky
                </button>
              </Link>
            </div>

            {mode === "login" ? (
              <form className="auth-luxe-form" onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}>
                <Field label="Email">
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="customer@skynest.vn"
                    {...loginForm.register("email", {
                      required: "Email la bat buoc.",
                      pattern: {
                        value: emailPattern,
                        message: "Email khong hop le."
                      },
                      setValueAs: (value) => normalizeEmail(String(value ?? ""))
                    })}
                  />
                </Field>
                {loginForm.formState.errors.email ? (
                  <p className="form-error">{loginForm.formState.errors.email.message}</p>
                ) : null}

                <Field label="Mat khau">
                  <div className="auth-luxe-password">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Nhap mat khau"
                      {...loginForm.register("password", {
                        required: "Mat khau la bat buoc."
                      })}
                    />
                    <button
                      type="button"
                      className="auth-luxe-password__toggle"
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? "An" : "Hien"}
                    </button>
                  </div>
                </Field>
                {loginForm.formState.errors.password ? (
                  <p className="form-error">{loginForm.formState.errors.password.message}</p>
                ) : null}

                {loginError ? <div className="auth-minimal-alert">{loginError}</div> : null}

                <Button className="auth-luxe-submit" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Dang dang nhap..." : "Dang nhap"}
                </Button>

                <div className="auth-luxe-meta">
                  <Link to={buildAuthHref("register", redirectTo)}>Dang ky</Link>
                </div>
              </form>
            ) : (
              <form
                className="auth-luxe-form"
                onSubmit={registerForm.handleSubmit((values) => registerMutation.mutate(values))}
              >
                <div className="auth-luxe-grid">
                  <div className="auth-luxe-grid__full">
                    <Field label="Ho va ten">
                      <Input
                        autoComplete="name"
                        placeholder="Nguyen Van A"
                        {...registerForm.register("full_name", {
                          required: "Ho va ten la bat buoc.",
                          validate: (value) =>
                            normalizeFullName(value).length >= 2 || "Ho va ten phai co it nhat 2 ky tu.",
                          setValueAs: (value) => normalizeFullName(String(value ?? ""))
                        })}
                      />
                    </Field>
                    {registerForm.formState.errors.full_name ? (
                      <p className="form-error">{registerForm.formState.errors.full_name.message}</p>
                    ) : null}
                  </div>

                  <div>
                    <Field label="Email">
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="customer@skynest.vn"
                        {...registerForm.register("email", {
                          required: "Email la bat buoc.",
                          pattern: {
                            value: emailPattern,
                            message: "Email khong hop le."
                          },
                          setValueAs: (value) => normalizeEmail(String(value ?? ""))
                        })}
                      />
                    </Field>
                    {registerForm.formState.errors.email ? (
                      <p className="form-error">{registerForm.formState.errors.email.message}</p>
                    ) : null}
                  </div>

                  <div>
                    <Field label="So dien thoai">
                      <Input
                        type="tel"
                        autoComplete="tel"
                        placeholder="+84 909 000 123"
                        {...registerForm.register("phone", {
                          required: "So dien thoai la bat buoc.",
                          validate: (value) => isValidPhone(value) || "So dien thoai khong hop le."
                        })}
                      />
                    </Field>
                    {registerForm.formState.errors.phone ? (
                      <p className="form-error">{registerForm.formState.errors.phone.message}</p>
                    ) : null}
                  </div>

                  <div>
                    <Field label="Mat khau">
                      <div className="auth-luxe-password">
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Tao mat khau"
                          {...registerForm.register("password", {
                            required: "Mat khau la bat buoc.",
                            pattern: {
                              value: passwordPattern,
                              message: "Mat khau chua du manh."
                            },
                            onChange: () => {
                              void registerForm.trigger("confirm_password");
                            }
                          })}
                        />
                        <button
                          type="button"
                          className="auth-luxe-password__toggle"
                          onClick={() => setShowPassword((current) => !current)}
                        >
                          {showPassword ? "An" : "Hien"}
                        </button>
                      </div>
                    </Field>
                    {registerForm.formState.errors.password ? (
                      <p className="form-error">{registerForm.formState.errors.password.message}</p>
                    ) : null}
                  </div>

                  <div>
                    <Field label="Xac nhan mat khau">
                      <div className="auth-luxe-password">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Nhap lai mat khau"
                          {...registerForm.register("confirm_password", {
                            required: "Ban can xac nhan mat khau.",
                            validate: (value) =>
                              value === registerForm.getValues("password") || "Mat khau xac nhan khong khop."
                          })}
                        />
                        <button
                          type="button"
                          className="auth-luxe-password__toggle"
                          onClick={() => setShowConfirmPassword((current) => !current)}
                        >
                          {showConfirmPassword ? "An" : "Hien"}
                        </button>
                      </div>
                    </Field>
                    {registerForm.formState.errors.confirm_password ? (
                      <p className="form-error">{registerForm.formState.errors.confirm_password.message}</p>
                    ) : null}
                  </div>
                </div>

                <label className="auth-luxe-check">
                  <input
                    type="checkbox"
                    {...registerForm.register("agree_terms", {
                      required: "Ban can dong y truoc khi dang ky."
                    })}
                  />
                  <span>Toi dong y dieu khoan su dung.</span>
                </label>
                {registerForm.formState.errors.agree_terms ? (
                  <p className="form-error">{registerForm.formState.errors.agree_terms.message}</p>
                ) : null}

                {registerError ? <div className="auth-minimal-alert">{registerError}</div> : null}

                <Button className="auth-luxe-submit" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Dang tao tai khoan..." : "Dang ky"}
                </Button>

                <div className="auth-luxe-meta">
                  <Link to={buildAuthHref("login", redirectTo)}>Dang nhap</Link>
                </div>
              </form>
            )}
          </Panel>
        </Card>
      </div>
    </div>
  );
};
