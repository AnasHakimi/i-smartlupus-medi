import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  // Verify the caller is an authenticated admin
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );

  const {
    data: { user: caller },
  } = await supabaseAuth.auth.getUser();

  if (!caller) {
    return NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 });
  }

  const { data: callerProfile } = await supabaseAuth
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (!callerProfile || callerProfile.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya pentadbir boleh mendaftar pengguna." },
      { status: 403 },
    );
  }

  // Validate request body
  const body = await request.json();
  const { email, password, full_name, ic_number, role, unit_name } = body;

  if (!email || !password || !full_name || !ic_number || !role) {
    return NextResponse.json(
      { error: "Maklumat tidak lengkap." },
      { status: 400 },
    );
  }

  // Create user via Admin API (no session switch)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  if (!authData.user) {
    return NextResponse.json({ error: "Pendaftaran gagal." }, { status: 400 });
  }

  // Create profile
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: authData.user.id,
    ic_number,
    full_name,
    role,
    unit_name: unit_name || null,
  });

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, userId: authData.user.id });
}
