import MedicalCard from "@/components/ui/MedicalCard";
import StatusBadge from "@/components/ui/StatusBadge";

type Priority = "low" | "moderate" | "high";

type ProtocolStep = {
	step: string;
	instruction: string;
	timeframe: string;
	priority: Priority;
};

type TreatmentProtocolProps = {
	title?: string;
	steps: ProtocolStep[];
};

function toVariant(priority: Priority): "success" | "warning" | "danger" {
	if (priority === "low") return "success";
	if (priority === "moderate") return "warning";
	return "danger";
}

export default function TreatmentProtocol({ title = "Treatment Protocol", steps }: TreatmentProtocolProps) {
	return (
		<MedicalCard className="p-8">
			<div className="space-y-6">
				<div className="border-b border-gray-700 pb-4">
					<h2 className="text-xl font-semibold text-text-primary">{title}</h2>
					<p className="mt-2 text-sm text-text-secondary">Stepwise protocol in medical-report sequence.</p>
				</div>

				<ol className="space-y-4">
					{steps.map((item, index) => (
						<li key={`${item.step}-${index}`} className="rounded-2xl border border-gray-700 bg-card-soft p-5">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p className="text-xs uppercase tracking-wide text-text-muted">Step {index + 1}</p>
									<h3 className="mt-1 text-base font-semibold text-text-primary">{item.step}</h3>
								</div>
								<StatusBadge variant={toVariant(item.priority)}>{item.priority} priority</StatusBadge>
							</div>

							<p className="mt-3 text-sm leading-relaxed text-text-secondary">{item.instruction}</p>

							<div className="mt-4 border-t border-gray-700 pt-3">
								<p className="text-xs uppercase tracking-wide text-text-muted">Timeframe</p>
								<p className="mt-1 text-sm text-text-primary">{item.timeframe}</p>
							</div>
						</li>
					))}
				</ol>
			</div>
		</MedicalCard>
	);
}
