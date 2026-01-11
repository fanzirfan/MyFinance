import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: DO NOT REMOVE auth.getUser()
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const url = request.nextUrl.clone();

    // Protected Routes
    const protectedPaths = ['/dashboard', '/wallets', '/transactions', '/transfer', '/settings'];
    const isProtected = protectedPaths.some(path => url.pathname.startsWith(path));

    // Auth Routes
    const authPaths = ['/login', '/register'];
    const isAuthPage = authPaths.some(path => url.pathname.startsWith(path));

    // 1. Jika User BELUM login dan akses halaman protected -> Redirect ke Login
    if (!user && isProtected) {
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // 2. Jika User SUDAH login dan akses halaman auth (login/register) -> Redirect ke Dashboard
    if (user && isAuthPage) {
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    // 3. Jika akses root '/' -> Redirect ke Dashboard jika login, atau Login jika belum
    if (url.pathname === '/') {
        if (user) {
            url.pathname = '/dashboard';
            return NextResponse.redirect(url);
        } else {
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - auth/callback (Supabase auth callback must be ignored by middleware to function properly?)
         * NO, auth callback needs middleware to set cookies! But we shouldn't redirect AWAY from it.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
