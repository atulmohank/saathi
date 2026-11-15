import { after, NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guard";
import { applyMedicineChange } from "@/lib/changes-apply";
import { db } from "@/lib/db";
import { resolveChangeFlow } from "@/lib/engine/changes";
import type { ChangeSource } from "@/lib/engine/types";
import { handleError, readJson } from "@/lib/http";
import { medicineSchema, uuid } from "@/lib/validation";
import { createActionLink } from "@/lib/action-links";
import { describeDiff } from "@/lib/describe";
import { proposalEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { appBaseUrl } from "@/lib/env";

const body = z.object({
  elderId: uuid,
  medicineId: uuid.nullable(),
  /** Create: full medicine. Edit: partial. Remove: { active: false }. */
  medicine: medicineSchema.partial().extend({ active: z.boolean().optional() }),
  doctorInstruction: z.boolean().default(false),
});

/**
 * Create / edit / remove a medicine. The engine decides whether it applies now
 * or becomes a proposal for the elder or decision partner.
 */
export async function POST(req: Request) {
  try {
    const input = body.parse(await readJson(req));
    if (!input.medicineId) medicineSchema.parse(input.medicine); // create needs every field
    if (Object.keys(input.medicine).length === 0) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });

    const { actor, elder } = await requirePermission(input.elderId, "edit_medicine");
    if (input.medicineId) {
      const { data: m } = await db().from("medicines").select("id").eq("id", input.medicineId).eq("elder_id", elder.id).maybeSingle();
      if (!m) return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const source: ChangeSource = input.doctorInstruction ? "doctor_instruction" : actor.role;
    const flow = resolveChangeFlow({ mode: elder.mode, source, actorRole: actor.role });

    if (flow === "apply_now") {
      const id = await applyMedicineChange({ circleId: actor.circleId, actorId: actor.memberId, elderId: elder.id, medicineId: input.medicineId, diff: input.medicine });
      if (source === "doctor_instruction" || actor.role !== "elder") {
        await db().from("change_proposals").insert({
          elder_id: elder.id,
          medicine_id: id,
          proposed_by: actor.memberId,
          source,
          diff: input.medicine,
          status: "applied",
          decided_by: actor.memberId,
          decided_at: new Date().toISOString(),
        });
      }
      return NextResponse.json({ ok: true, flow, medicineId: id });
    }

    const { data: p } = await db()
      .from("change_proposals")
      .insert({ elder_id: elder.id, medicine_id: input.medicineId, proposed_by: actor.memberId, source, diff: input.medicine })
      .select("id")
      .single();
    await audit({ circleId: actor.circleId, actor: actor.memberId, action: "proposal_created", entity: "change_proposal", entityId: p?.id, after: input.medicine });
    if (p?.id) {
      const proposalId = p.id as string;
      // Email the approver after the response is sent (SMTP can take a second or two).
      after(() => notifyProposal(proposalId, elder.id, flow === "needs_elder_approval" ? "elder" : "decision_partner", actor.name, input.medicineId, input.medicine));
    }
    return NextResponse.json({ ok: true, flow });
  } catch (e) {
    return handleError(e);
  }
}

async function notifyProposal(
  proposalId: string,
  elderId: string,
  approverRole: "elder" | "decision_partner",
  proposer: string,
  medicineId: string | null,
  diff: Record<string, unknown>,
) {
  const { data: elder } = await db().from("elders").select("id, circle_id, display_name, care_circles!inner(is_demo)").eq("id", elderId).single();
  if (!elder) return;
  const { data: members } = await db().from("members").select("id, display_name, email, role, elder_id").eq("circle_id", elder.circle_id);
  const approvers = (members ?? []).filter((m) => (approverRole === "elder" ? m.role === "elder" && m.elder_id === elderId : m.role === "decision_partner"));
  const medName = medicineId ? ((await db().from("medicines").select("name").eq("id", medicineId).single()).data?.name ?? "a medicine") : String(diff.name ?? "a new medicine");
  for (const m of approvers) {
    const email = proposalEmail({
      toName: m.display_name,
      elderName: elder.display_name,
      forElder: m.role === "elder",
      proposer,
      medName,
      summary: describeDiff(diff, "en", !medicineId),
      approveUrl: await createActionLink("approve_change", proposalId, m.id),
      reviewUrl: `${env().APP_BASE_URL.replace(/\/$/, "")}/`,
    });
    await sendEmail({
      circleId: elder.circle_id,
      isDemo: (elder.care_circles as unknown as { is_demo: boolean }).is_demo,
      to: { memberId: m.id, name: m.display_name, email: m.email },
      kind: "change_proposal",
      email,
    });
  }
}
