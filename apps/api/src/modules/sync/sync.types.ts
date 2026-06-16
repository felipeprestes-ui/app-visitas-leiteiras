import { IsArray, IsIn, IsObject, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export type SyncEntityType = "client" | "property" | "schedule" | "visit";

export class SyncItemDto {
  @IsString()
  localId!: string;

  @IsIn(["client", "property", "schedule", "visit"])
  entityType!: SyncEntityType;

  @IsIn(["create", "update"])
  operation!: "create" | "update";

  @IsObject()
  record!: Record<string, unknown> & {
    id: string;
  };
}

export class SyncPushDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncItemDto)
  items!: SyncItemDto[];
}