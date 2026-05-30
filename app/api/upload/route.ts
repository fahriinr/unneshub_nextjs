import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = formData.get("bucket") as string | null;

    if (!file || !bucket) {
      return NextResponse.json({ error: "Missing file or bucket" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nyuomnjaxklktiygbcrp.supabase.co";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase Service Role Key is not configured on the server." }, { status: 500 });
    }

    // Generate unique filename to avoid collision
    const ext = file.name.split(".").pop() || "";
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${Date.now()}_${randomStr}.${ext}`;
    const filePath = fileName;

    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`;
    const fileBuffer = await file.arrayBuffer();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "apikey": supabaseServiceKey,
        "Content-Type": file.type,
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = "Failed to upload to storage";
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error || errJson.message || errMsg;
      } catch {
        errMsg = errText || errMsg;
      }
      return NextResponse.json({ error: errMsg }, { status: response.status });
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
    return NextResponse.json({ url: publicUrl }, { status: 200 });

  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
