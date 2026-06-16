import type { ConsultantArea, UserRole } from "@app/types";

export type MobileSession = {
  userId: string;
  name: string;
  role: UserRole;
  consultantArea?: ConsultantArea;
};