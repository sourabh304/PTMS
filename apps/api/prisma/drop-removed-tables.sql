-- Tables removed from the data model (pricing: plans and subscriptions).
-- Run before `prisma db push` so existing databases upgrade without a data-loss prompt.
DROP TABLE IF EXISTS "Subscription";
DROP TABLE IF EXISTS "Plan";
