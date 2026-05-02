# E2E User Flow Audit - i-SMARTLUPUS-MEDI

Date: 2026-05-02
Status: Verified (Impeccable Standard)

## 1. Staff Flow: Permohonan & Foto
*Hospital staff submitting and documenting a disposal request.*

### Process
1.  **Submission**: Staff calls `submit_disposal_ticket` RPC. The database generates a `ticket_no` and status `menunggu_semakan`.
2.  **Auditing**: A `permohonan_dibuat` entry is automatically written to the immutable audit trail.
3.  **Documentation**: Staff uploads a photo. The system uses a **Signed URL** to put the file in a private bucket and calls `attach_disposal_photo` to link it.

### Diagram
```text
[ STAFF ] ----(Login)----> [ Dashboard ] ----(Mohon)----> [ Form ]
                                                             |
   [ Audit Log ] <---(RPC: submit_disposal_ticket)-----------'
        |                                                    |
        '----------(Status: Menunggu Semakan) <--------------'
                               |
[ Private Bucket ] <---(Upload Asset Photo)--- [ Ticket Detail ]
        |                                            |
        '---(RPC: attach_disposal_photo)-------------'
```

---

## 2. Unit Aset Flow: Semakan & Kelulusan
*Reviewing and transitioning tickets from request to process.*

### Process
1.  **Queue**: Officer views the `/semakan` list (exclusive to their role).
2.  **Decision**: 
    *   **Lulus**: Calls `approve_disposal_ticket`. Status becomes `proses_pelupusan`.
    *   **Tolak**: Calls `reject_disposal_ticket` with a reason. Status becomes `ditolak`.
3.  **Integrity**: The audit trail records the transition and the officer's ID.

### Diagram
```text
[ UNIT ASET ] --(Login)--> [ /semakan ] --(Review Ticket)--> [ Decision ]
                                                                 |
            .----------------------------------------------------'
            |                               |
     [ Action: Lulus ]              [ Action: Tolak ]
            |                               |
 (RPC: approve_ticket)            (RPC: reject_ticket)
            |                               |
 [ Status: Proses Pelupusan ]       [ Status: Ditolak ]
            |                               |
     [ Audit: semakan_lulus ]        [ Audit: semakan_ditolak ]
```

---

## 3. Unit Aset Flow: Pelaksanaan & Sijil
*Executing disposal and generating official records.*

### Process
1.  **Execution**: When the asset is physically disposed of, the officer selects the method (e.g., *Musnah*) and completes the ticket.
2.  **Completion**: Calls `complete_disposal_ticket`. Status becomes `selesai`.
3.  **Certification**: The officer triggers `CertificateGenerator`. A PDF is built on the fly, stored privately, and a signed download link is generated for the staff to see.

### Diagram
```text
[ UNIT ASET ] --(View Ticket)--> [ TicketActions ] --(Select Method)--> [ Complete ]
                                                                             |
      [ Audit: pelupusan_selesai ] <---(RPC: complete_disposal_ticket)-------'
                                                                             |
[ Private Bucket ] <---(Upload PDF)--- [ CertificateGenerator ] <---(Status: Selesai)
        |                                      |
        '---(RPC: attach_certificate)----------'
```

---

## 4. Admin Flow: Pengurusan Pengguna
*Managing the institutional identity boundary.*

### Process
1.  **Hardened API**: Admin uses `/api/register`.
2.  **Server Logic**: The server validates the IC, derives the internal email, and attempts to create the Auth user + Profile.
3.  **Atomic Rollback**: If the profile creation fails (e.g., duplicate IC), the server **automatically deletes** the Auth user to prevent orphaned accounts.

### Diagram
```text
[ ADMIN ] --(Login)--> [ /pengguna ] --(Register User)--> [ API: /api/register ]
                                                                   |
          .--------------------------------------------------------'
          |                                     |
[ Step 1: Create Auth ]             [ Step 2: Create Profile ]
          |                                     |
          | <-----------(IF FAIL: DELETE AUTH)--'
          |                                     |
[ Result: SUCCESS ]                 [ Audit: User Created ]
```

---

## Security Audit Summary

| Feature | Implementation | Status |
| :--- | :--- | :--- |
| **State Machine** | Handled strictly by Postgres RPCs (no client-side status updates). | ✅ Impeccable |
| **Audit Trail** | Immutable logs written within the same transaction as state changes. | ✅ Impeccable |
| **Role Guard** | RLS prevents staff from seeing `/semakan` or updating other tickets. | ✅ Impeccable |
| **File Safety** | Signed URLs expire after 10-60 mins; no public access to photos. | ✅ Impeccable |
| **API Safety** | Admin endpoint uses Service Role Key + caller role verification. | ✅ Impeccable |
