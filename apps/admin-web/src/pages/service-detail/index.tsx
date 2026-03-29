import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Badge, Card, Panel, SectionTitle } from "@paragliding/ui";
import { adminApi } from "@/shared/config/api";
import { formatCurrency } from "@/shared/lib/format";
import { AdminLayout } from "@/widgets/layout/admin-layout";

export const ServiceDetailPage = () => {
  const { slug = "" } = useParams();
  const { data } = useQuery({
    queryKey: ["admin-service", slug],
    queryFn: () => adminApi.getService(slug)
  });

  if (!data) {
    return (
      <AdminLayout>
        <div className="portal-stack">Loading service package...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="portal-stack">
        <SectionTitle eyebrow="Service detail" title={data.name} description={data.short_description} />
        <Card>
          <Panel className="admin-stack">
            <img className="admin-detail-image" src={data.hero_image} alt={data.name} />
            <div className="table-actions--inline">
              <Badge>{formatCurrency(data.price)}</Badge>
              <Badge tone={data.active ? "success" : "danger"}>{data.active ? "ACTIVE" : "INACTIVE"}</Badge>
            </div>
            <p>{data.description}</p>
            <div className="inline-field-grid inline-field-grid--two">
              <div className="row-meta">
                <strong>Flight duration</strong>
                <span>{data.flight_duration_minutes} minutes</span>
              </div>
              <div className="row-meta">
                <strong>Minimum child age</strong>
                <span>{data.min_child_age}+</span>
              </div>
            </div>
          </Panel>
        </Card>
      </div>
    </AdminLayout>
  );
};
