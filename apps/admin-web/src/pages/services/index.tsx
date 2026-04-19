import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, Dialog, Field, Input, Panel, Textarea } from "@paragliding/ui";
import type { ServiceFeature, ServiceFeatureWritePayload, ServicePackage } from "@paragliding/api-client";
import { adminApi } from "@/shared/config/api";
import { routes } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/lib/format";
import { AdminLayout } from "@/widgets/layout/admin-layout";
import { DataTable } from "@/widgets/data-table/data-table";

const blankFeature: ServiceFeatureWritePayload = {
  name: "",
  description: "",
  active: true
};

export const ServicesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [featureEditing, setFeatureEditing] = useState<ServiceFeature | null>(null);
  const [featurePendingDelete, setFeaturePendingDelete] = useState<ServiceFeature | null>(null);
  const featureForm = useForm<ServiceFeatureWritePayload>({ defaultValues: blankFeature });

  const servicesQuery = useQuery({
    queryKey: ["admin-services"],
    queryFn: () => adminApi.listServices()
  });

  const featuresQuery = useQuery({
    queryKey: ["admin-service-features"],
    queryFn: () => adminApi.listServiceFeatures()
  });

  useEffect(() => {
    featureForm.reset(featureEditing ? {
      name: featureEditing.name,
      description: featureEditing.description,
      active: featureEditing.active
    } : blankFeature);
  }, [featureEditing, featureForm]);

  const saveFeatureMutation = useMutation({
    mutationFn: (payload: ServiceFeatureWritePayload) =>
      featureEditing
        ? adminApi.updateServiceFeature(featureEditing.id, payload)
        : adminApi.createServiceFeature(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-features"] });
      setFeatureEditing(null);
      featureForm.reset(blankFeature);
    }
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: (featureId: string) => adminApi.deleteServiceFeature(featureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-features"] });
      setFeaturePendingDelete(null);
    }
  });

  return (
    <AdminLayout>
      <div className="portal-stack">
        <div className="portal-heading">
          <div className="portal-heading__text">
            <Badge>Service management</Badge>
            <h1>Services</h1>
            <p>Quản lý gói dịch vụ và danh sách dịch vụ đi kèm để dùng lại khi tạo hoặc chỉnh sửa gói.</p>
          </div>
          <Button onClick={() => navigate("/services/new")}>Tạo gói dịch vụ</Button>
        </div>

        <Card className="admin-list-card">
          <Panel className="admin-stack">
            <div className="admin-card__header">
              <div>
                <h3>Danh sách gói dịch vụ</h3>
                <p>Click vào từng gói để chỉnh sửa thông tin, giá và features đi kèm.</p>
              </div>
            </div>
            <DataTable<ServicePackage>
              data={servicesQuery.data ?? []}
              getRowKey={(row) => row.slug}
              onRowClick={(row) => navigate(`/services/${row.slug}`)}
              columns={[
                {
                  key: "service",
                  title: "Gói dịch vụ",
                  render: (row) => (
                    <div className="row-meta">
                      <strong>{row.name}</strong>
                      <span>{row.slug}</span>
                      <small>{row.short_description}</small>
                    </div>
                  )
                },
                {
                  key: "price",
                  title: "Giá",
                  render: (row) => formatCurrency(row.price)
                },
                {
                  key: "features",
                  title: "Features",
                  render: (row) => `${row.included_services.length} dịch vụ`
                },
                {
                  key: "status",
                  title: "Trạng thái",
                  render: (row) => <Badge tone={row.active ? "success" : "danger"}>{row.active ? "ACTIVE" : "INACTIVE"}</Badge>
                },
                {
                  key: "open",
                  title: "",
                  render: (row) => (
                    <Button
                      variant="secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/services/${row.slug}`);
                      }}
                    >
                      Xem chi tiết
                    </Button>
                  )
                }
              ]}
            />
          </Panel>
        </Card>

        <Card className="admin-form-card">
          <Panel className="admin-stack">
            <div className="admin-card__header">
              <div>
                <h3>Dịch vụ đi kèm - features</h3>
                <p>Tạo feature một lần rồi chọn nhiều feature khi tạo hoặc chỉnh sửa gói dịch vụ.</p>
              </div>
            </div>

            <form className="admin-form admin-form--compact" onSubmit={featureForm.handleSubmit((values) => saveFeatureMutation.mutate(values))}>
              <div className="inline-field-grid inline-field-grid--two">
                <Field label="Tên feature">
                  <Input {...featureForm.register("name", { required: true })} />
                </Field>
                <Field label="Mô tả ngắn">
                  <Textarea {...featureForm.register("description")} />
                </Field>
              </div>
              <label className="admin-checkbox">
                <input type="checkbox" {...featureForm.register("active")} />
                <span>Đang sử dụng</span>
              </label>
              {saveFeatureMutation.error instanceof Error ? <p className="form-error">{saveFeatureMutation.error.message}</p> : null}
              <div className="table-actions--inline">
                <Button disabled={saveFeatureMutation.isPending}>
                  {saveFeatureMutation.isPending ? "Đang lưu..." : featureEditing ? "Lưu feature" : "Tạo feature"}
                </Button>
                {featureEditing ? (
                  <Button type="button" variant="secondary" onClick={() => setFeatureEditing(null)}>
                    Hủy sửa
                  </Button>
                ) : null}
              </div>
            </form>

            <DataTable<ServiceFeature>
              data={featuresQuery.data ?? []}
              getRowKey={(row) => row.id}
              columns={[
                {
                  key: "name",
                  title: "Feature",
                  render: (row) => (
                    <div className="row-meta">
                      <strong>{row.name}</strong>
                      <small>{row.description || "Không có mô tả"}</small>
                    </div>
                  )
                },
                {
                  key: "active",
                  title: "Trạng thái",
                  render: (row) => <Badge tone={row.active ? "success" : "danger"}>{row.active ? "ACTIVE" : "INACTIVE"}</Badge>
                },
                {
                  key: "actions",
                  title: "",
                  render: (row) => (
                    <div className="table-actions--inline">
                      <Button variant="secondary" onClick={() => setFeatureEditing(row)}>
                        Sửa
                      </Button>
                      <Button variant="secondary" onClick={() => setFeaturePendingDelete(row)}>
                        Xóa
                      </Button>
                    </div>
                  )
                }
              ]}
            />
          </Panel>
        </Card>

        <Dialog
          open={Boolean(featurePendingDelete)}
          onOpenChange={(open) => {
            if (!open && !deleteFeatureMutation.isPending) {
              setFeaturePendingDelete(null);
            }
          }}
          title={`Xóa feature ${featurePendingDelete?.name ?? ""}`}
          description="Feature sẽ biến mất khỏi danh sách chọn khi tạo hoặc chỉnh sửa gói dịch vụ."
          icon="!"
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setFeaturePendingDelete(null)}>
                Đóng
              </Button>
              <Button
                type="button"
                disabled={!featurePendingDelete || deleteFeatureMutation.isPending}
                onClick={() => {
                  if (featurePendingDelete) {
                    deleteFeatureMutation.mutate(featurePendingDelete.id);
                  }
                }}
              >
                {deleteFeatureMutation.isPending ? "Đang xóa..." : "Xóa feature"}
              </Button>
            </>
          }
        >
          {deleteFeatureMutation.error instanceof Error ? <p className="form-error">{deleteFeatureMutation.error.message}</p> : null}
        </Dialog>
      </div>
    </AdminLayout>
  );
};
