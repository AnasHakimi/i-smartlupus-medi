import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const body = await request.json();
  const { email, password, full_name, ic_number, role, unit_name } = body;

  // Create user via Admin API (no session switch)
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
