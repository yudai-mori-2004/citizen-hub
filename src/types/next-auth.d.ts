import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      userId: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface JWT {
    userId: string
  }
}
