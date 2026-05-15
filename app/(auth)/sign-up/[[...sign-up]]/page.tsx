import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { KanjealoLogo } from "@/components/logo";

const apariencia = {
  variables: {
    colorPrimary: "#FF5C3A",
    colorBackground: "#FAF8F5",
    colorText: "#0F2044",
    colorTextSecondary: "rgba(15,32,68,0.5)",
    colorInputBackground: "#ffffff",
    colorInputText: "#0F2044",
    colorNeutral: "#0F2044",
    colorDanger: "#e53e3e",
    borderRadius: "12px",
    fontFamily: "Outfit, sans-serif",
    fontSize: "14px",
    fontWeight: { normal: 400, medium: 500, bold: 700 },
    spacingUnit: "16px",
  },
  elements: {
    rootBox: { width: "100%" },
    cardBox: {
      width: "100%",
      boxShadow: "none",
      borderRadius: "0",
      background: "transparent",
    },
    card: {
      width: "100%",
      boxShadow: "none",
      borderRadius: "0",
      background: "#FAF8F5",
      border: "none",
      paddingBottom: "24px",
    },
    headerTitle: "!font-extrabold !text-navy !text-2xl",
    headerSubtitle: "!text-navy/50 !text-sm",
    socialButtonsBlockButton:
      "!border !border-navy/10 !rounded-xl !bg-white !text-navy !font-medium hover:!bg-navy/5",
    dividerLine: "!bg-navy/10",
    dividerText: "!text-navy/30 !text-xs",
    formFieldLabel: "!font-bold !text-navy !text-sm",
    formFieldInput:
      "!bg-white !rounded-xl !border !border-navy/10 !text-navy !text-sm focus:!ring-2 focus:!ring-coral/30 placeholder:!text-navy/30",
    formButtonPrimary:
      "!bg-coral hover:!bg-[#e04d2e] !text-white !font-bold !rounded-xl !shadow-none",
    identityPreviewEditButton: "!text-coral",
    formResendCodeLink: "!text-coral",
    otpCodeFieldInput: "!border-navy/20 !rounded-xl !text-navy",
    alert: "!rounded-xl",
    alertText: "!text-sm",
    footer: { display: "none" },
  },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-6">
      <div className="mb-8">
        <KanjealoLogo tamaño="lg" variante="blanco" />
      </div>

      <div className="w-full max-w-sm bg-cream rounded-3xl shadow-2xl overflow-hidden">
        <SignUp appearance={apariencia} />

        <div className="px-8 pb-8">
          <div className="border-t border-navy/10 pt-5 flex flex-col items-center gap-2">
            <p className="text-xs text-navy/40">¿Ya tienes cuenta?</p>
            <Link
              href="/sign-in"
              className="w-full text-center py-2.5 px-4 rounded-xl border border-navy/15 text-sm font-semibold text-navy hover:bg-navy/5 transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>

      <p className="text-center text-white/20 text-xs mt-6">
        Empieza gratis · sin tarjeta de crédito
      </p>
    </div>
  );
}
