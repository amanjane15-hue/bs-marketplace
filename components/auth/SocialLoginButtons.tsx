"use client";

type SocialLoginButtonsProps = {
  loading: boolean;
  onProviderClick: (provider: "Google" | "Facebook" | "Apple") => void;
};

const providers = [
  { key: "Google", label: "Continue with Google" },
  { key: "Facebook", label: "Continue with Facebook" },
  { key: "Apple", label: "Continue with Apple" },
] as const;

export default function SocialLoginButtons({ loading, onProviderClick }: SocialLoginButtonsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
        <span className="block h-px flex-1 bg-slate-200" />
        <span>or continue with</span>
        <span className="block h-px flex-1 bg-slate-200" />
      </div>
      {providers.map((provider) => (
        <button
          key={provider.key}
          type="button"
          disabled={loading}
          onClick={() => onProviderClick(provider.key)}
          className="inline-flex w-full items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
            {provider.key.slice(0, 1)}
          </span>
          {provider.label}
        </button>
      ))}
    </div>
  );
}
