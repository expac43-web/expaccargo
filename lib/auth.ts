import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { rateLimit } from "@/lib/rate-limit"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Encode une valeur pour un filtre PostgREST (protège aussi ( ) ' ! *).
function pgEnc(value: string): string {
  return encodeURIComponent(value).replace(
    /[()'!*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  )
}

/**
 * Récupère un utilisateur par email via l'API REST Supabase (port 443).
 * Évite la dépendance à Prisma/PostgreSQL (port 5432) pour l'authentification.
 */
async function getUserByEmail(email: string) {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/User?email=eq.${pgEnc(email.toLowerCase())}&select=id,name,email,password,role,isActive&limit=1`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        cache: "no-store",
      }
    )
    if (!r.ok) {
      console.error("[auth] getUserByEmail HTTP error:", r.status, await r.text())
      return null
    }
    const data = await r.json()
    return (data[0] as {
      id: string
      name: string
      email: string
      password: string
      role: string
      isActive: boolean
    }) ?? null
  } catch (e) {
    console.error("[auth] getUserByEmail fetch error:", e)
    return null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        // Anti-bruteforce : 10 tentatives / 15 min par email
        const rl = rateLimit(`login:${email.toLowerCase()}`, 10, 15 * 60 * 1000)
        if (!rl.ok) return null

        const user = await getUserByEmail(email)
        if (!user) return null
        if (!user.isActive) return null

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { id: string; role: string }).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = session.user as any
        u.id = token.id as string
        u.role = token.role as string
      }
      return session
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.AUTH_SECRET,
})
