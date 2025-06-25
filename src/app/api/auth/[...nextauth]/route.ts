import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { sql } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback triggered:', { provider: account?.provider, email: profile?.email });
      
      if (account?.provider === 'google' && profile?.email) {
        try {
          // Check if user exists
          const [existingUser] = await sql`
            SELECT id FROM users WHERE email = ${profile.email}
          `;

          if (!existingUser) {
            // Create new user
            console.log('Creating new user:', profile.email);
            await sql`
              INSERT INTO users (email, name, image, google_id)
              VALUES (
                ${profile.email}, 
                ${profile.name || ''}, 
                ${profile.picture || null},
                ${profile.sub}
              )
            `;
          } else {
            // Update existing user info
            console.log('Updating existing user:', profile.email);
            await sql`
              UPDATE users 
              SET 
                name = ${profile.name || ''},
                image = ${profile.picture || null},
                google_id = ${profile.sub},
                updated_at = CURRENT_TIMESTAMP
              WHERE email = ${profile.email}
            `;
          }
          
          console.log('User database operation successful');
          return true;
        } catch (error) {
          console.error('Error during sign in:', error);
          // Still return true to allow sign in even if database operation fails
          return true;
        }
      }
      
      // Allow sign in for other cases
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.id = profile.sub;
        token.email = profile.email;
        token.name = profile.name;
        token.picture = profile.picture;
        
        // Get user ID from database
        try {
          const [user] = await sql`
            SELECT id FROM users WHERE email = ${profile.email}
          `;
          if (user) {
            token.userId = user.id;
          }
        } catch (error) {
          console.error('Error fetching user ID:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.userId = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
