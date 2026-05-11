import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/features/auth/useLogin";

const loginSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해 주세요."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@seoul-hospital.test",
      password: "password1234",
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <main className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-[1.05fr_1fr]">
      {/* ───────────────────────── Left: Brand Panel ───────────────────────── */}
      <aside
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12"
        style={{
          background:
            "radial-gradient(120% 80% at 0% 0%, #2e2b8c 0%, #1c1e54 45%, #061b31 100%)",
        }}
      >
        {/* Decorative gradient orb */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #f96bee 0%, #ea2261 40%, transparent 70%)",
          }}
        />
        {/* Decorative purple orb */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-20 h-[380px] w-[380px] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #533afd 0%, #2e2b8c 50%, transparent 75%)",
          }}
        />
        {/* Faint grid texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Top spacer */}
        <div className="relative z-10" />

        {/* Middle: Hero copy */}
        <div className="relative z-10 max-w-md">
          <p
            className="mb-5 text-[12px] font-semibold uppercase text-white/60"
            style={{
              fontFamily: "'Pretendard', sans-serif",
              letterSpacing: "0.14em",
            }}
          >
            Voice AI · CX Operations
          </p>
          <h1
            className="text-white"
            style={{
              fontFamily: "'SUIT', 'Pretendard', sans-serif",
              fontSize: "44px",
              fontWeight: 800,
              lineHeight: 1.18,
              letterSpacing: "-0.88px",
            }}
          >
            모든 통화를
            <br />
            데이터로,
            <br />
            <span
              style={{
                background:
                  "linear-gradient(90deg, #ffd7ef 0%, #f96bee 50%, #ea2261 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              데이터를 인사이트로.
            </span>
          </h1>
          <p
            className="mt-6 max-w-sm text-white/70"
            style={{
              fontFamily: "'Pretendard', sans-serif",
              fontSize: "16px",
              fontWeight: 500,
              lineHeight: 1.6,
            }}
          >
            관리자 대시보드에서 실시간 통화 분석, 인텐트 분류, VOC 트렌드를 한
            화면으로 확인하세요.
          </p>
        </div>

        {/* Bottom: copyright */}
        <div className="relative z-10 flex flex-col gap-3">
          <div
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
            }}
          />
          <p
            className="text-white/40"
            style={{
              fontFamily: "'Pretendard', sans-serif",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            © {new Date().getFullYear()} sisicallcall. All rights reserved.
          </p>
        </div>
      </aside>

      {/* ───────────────────────── Right: Form Panel ───────────────────────── */}
      <section className="relative flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[420px]">
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            {/* Email field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                style={{
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#273951",
                }}
              >
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                aria-invalid={Boolean(form.formState.errors.email)}
                className="h-11"
                style={{
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#061b31",
                  border: form.formState.errors.email
                    ? "1px solid #ea2261"
                    : "1px solid #e5edf5",
                  borderRadius: "6px",
                  backgroundColor: "#ffffff",
                }}
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p
                  style={{
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#ea2261",
                    marginTop: "6px",
                  }}
                >
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                style={{
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#273951",
                }}
              >
                비밀번호
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                aria-invalid={Boolean(form.formState.errors.password)}
                className="h-11"
                style={{
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#061b31",
                  border: form.formState.errors.password
                    ? "1px solid #ea2261"
                    : "1px solid #e5edf5",
                  borderRadius: "6px",
                  backgroundColor: "#ffffff",
                }}
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p
                  style={{
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#ea2261",
                    marginTop: "6px",
                  }}
                >
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>

            {/* Server-side error banner */}
            {loginMutation.isError ? (
              <div
                role="alert"
                className="px-3.5 py-3"
                style={{
                  backgroundColor: "rgba(234,34,97,0.08)",
                  border: "1px solid rgba(234,34,97,0.25)",
                  borderRadius: "6px",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: "13px",
                    fontWeight: 500,
                    lineHeight: 1.5,
                    color: "#ea2261",
                  }}
                >
                  {loginMutation.error.message}
                </p>
              </div>
            ) : null}

            {/* Submit button */}
            <Button
              className="w-full"
              type="submit"
              disabled={loginMutation.isPending}
              style={{
                height: "44px",
                backgroundColor: "#533afd",
                color: "#ffffff",
                borderRadius: "6px",
                fontFamily: "'Pretendard', sans-serif",
                fontSize: "15px",
                fontWeight: 600,
                boxShadow:
                  "rgba(50,50,93,0.25) 0px 13px 27px -5px, rgba(0,0,0,0.1) 0px 8px 16px -8px",
              }}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </Button>

            {/* Back link */}
            <div className="pt-2 text-center">
              <Link
                to="/"
                style={{
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#64748d",
                }}
                className="hover:underline"
              >
                랜딩 페이지로 돌아가기
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
