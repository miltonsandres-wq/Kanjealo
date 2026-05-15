import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const rutasProtegidas = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
]);

const rutasAuth = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Usuario autenticado intentando acceder a páginas públicas → llevar al dashboard
  if (userId && rutasAuth(req)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Rutas protegidas sin sesión → Clerk maneja el redirect a sign-in
  if (rutasProtegidas(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
