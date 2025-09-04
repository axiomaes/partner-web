import { BRAND } from "@/shared/brand";

export default function SiteFooter() {
  return (
    <footer className="border-t mt-8">
      <div className="max-w-6xl mx-auto w-full px-4 py-6 text-xs text-base-content/70 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span>© {new Date().getFullYear()} Axioma Loyalty · {BRAND.name}</span>
        <span className="opacity-40">•</span>
        <a className="link" href="/legal/privacidad">Privacidad</a>
        <span className="opacity-40">•</span>
        <a className="link" href="/legal/aviso">Aviso legal</a>
        <span className="opacity-40">•</span>
        <a className="link" href="/legal/cookies">Cookies</a>
      </div>
    </footer>
  );
}
