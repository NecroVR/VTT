import type { FastifyPluginAsync } from 'fastify';
import { users } from '@vtt/database';
import { eq } from 'drizzle-orm';

/**
 * Users API routes
 * Example routes demonstrating database usage
 */
const usersRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/users - List all users
   */
  fastify.get('/users', async () => {
    const allUsers = await fastify.db.select().from(users);
    return { users: allUsers };
  });

  /**
   * GET /api/v1/users/:id - Get user by ID
   */
  fastify.get<{ Params: { id: string } }>('/users/:id', async (request, reply) => {
    const { id } = request.params;

    const [user] = await fastify.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return { user };
  });

  /**
   * POST /api/v1/users - Create a new user
   */
  fastify.post<{ Body: { email: string; username: string } }>(
    '/users',
    async (request, reply) => {
      const { email, username } = request.body;

      // Validate input
      if (!email || !username) {
        return reply.status(400).send({ error: 'Email and username are required' });
      }

      try {
        const [newUser] = await fastify.db
          .insert(users)
          .values({ email, username })
          .returning();

        return reply.status(201).send({ user: newUser });
      } catch (error) {
        fastify.log.error(error, 'Failed to create user');
        return reply.status(500).send({ error: 'Failed to create user' });
      }
    }
  );
};

export default usersRoute;
