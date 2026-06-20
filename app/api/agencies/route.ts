import { NextResponse } from "next/server";
import { sbGet } from "@/lib/supabase-admin";

// Public — liste des agences actives (pour que le client puisse choisir)
export async function GET() {
  const agencies = await sbGet<{ id: string; name: string; city: string; country: string }>(
    "Agency",
    "select=id,name,city,country&order=name.asc"
  );
  return NextResponse.json(agencies);
}
