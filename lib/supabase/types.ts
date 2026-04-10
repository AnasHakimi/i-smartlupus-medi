export type UserRole = "user" | "unit_aset" | "admin";

export type AssetCondition = "rosak" | "usang";

export type TicketStatus =
  | "menunggu_semakan"
  | "proses_pelupusan"
  | "selesai"
  | "ditolak";

export type DisposalMethod = "jualan" | "lelong" | "musnah" | "serah_agensi";

export interface Profile {
  id: string;
  ic_number: string;
  full_name: string;
  role: UserRole;
  unit_name: string | null;
  created_at: string;
}

export interface DisposalTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  asset_name: string;
  asset_description: string | null;
  asset_condition: AssetCondition;
  quantity: number;
  unit_name: string;
  disposal_method: DisposalMethod | null;
  status: TicketStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  ticket_id: string;
  actor_id: string;
  action: string;
  from_status: TicketStatus | null;
  to_status: TicketStatus | null;
  notes: string | null;
  created_at: string;
}
