import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Ensure global BigInt serialization works consistently across all responses
BigInt.prototype.toJSON = function () {
  return Number(this);
};

export default prisma;
