import { z } from 'zod';
import { Role } from '@prisma/client';

export const getUsersQuerySchema = z.object({
    query: z.object({
        page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
        limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
        search: z.string().optional(),
        role: z.nativeEnum(Role).optional(),
    }),
});

export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>['query'];