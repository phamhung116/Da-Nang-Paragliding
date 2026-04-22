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
  name_en: "",
  description: "",
  description_en: "",
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
      name_en: featureEditing.name_en,
      description: featureEditing.description,
      description_en: featureEditing.description_en,
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
            <p>Quáº£n lÃ½ gÃ³i dá»‹ch vá»¥ vÃ  danh sÃ¡ch dá»‹ch vá»¥ Ä‘i kÃ¨m Ä‘á»ƒ dÃ¹ng láº¡i khi táº¡o hoáº·c chá»‰nh sá»­a gÃ³i.</p>
          </div>
          <Button onClick={() => navigate("/services/new")}>Táº¡o gÃ³i dá»‹ch vá»¥</Button>
        </div>

        <Card className="admin-list-card">
          <Panel className="admin-stack">
            <div className="admin-card__header">
              <div>
                <h3>Danh sÃ¡ch gÃ³i dá»‹ch vá»¥</h3>
                <p>Click vÃ o tá»«ng gÃ³i Ä‘á»ƒ chá»‰nh sá»­a thÃ´ng tin, giÃ¡ vÃ  features Ä‘i kÃ¨m.</p>
              </div>
            </div>
            <DataTable<ServicePackage>
              data={servicesQuery.data ?? []}
              getRowKey={(row) => row.slug}
              onRowClick={(row) => navigate(`/services/${row.slug}`)}
              columns={[
                {
                  key: "service",
                  title: "GÃ³i dá»‹ch vá»¥",
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
                  title: "GiÃ¡",
                  render: (row) => formatCurrency(row.price)
                },
                {
                  key: "features",
                  title: "Features",
                  render: (row) => `${row.included_features.length} dá»‹ch vá»¥`
                },
                {
                  key: "status",
                  title: "Tráº¡ng thÃ¡i",
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
                      Xem chi tiáº¿t
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
                <h3>Dá»‹ch vá»¥ Ä‘i kÃ¨m - features</h3>
                <p>Táº¡o feature má»™t láº§n rá»“i chá»n nhiá»u feature khi táº¡o hoáº·c chá»‰nh sá»­a gÃ³i dá»‹ch vá»¥.</p>
              </div>
            </div>

            <form
              className="admin-form admin-form--compact"
              onSubmit={featureForm.handleSubmit((values) =>
                saveFeatureMutation.mutate({
                  ...values,
                  name_en: values.name.trim(),
                  description_en: values.description.trim()
                })
              )}
            >
              <div className="inline-field-grid inline-field-grid--two">
                <Field label="TÃªn feature">
                  <Input {...featureForm.register("name", { required: true })} />
                </Field>
              </div>
              <div className="inline-field-grid inline-field-grid--two">
                <Field label="MÃ´ táº£ ngáº¯n">
                  <Textarea {...featureForm.register("description")} />
                </Field>
              </div>
              <label className="admin-checkbox">
                <input type="checkbox" {...featureForm.register("active")} />
                <span>Äang sá»­ dá»¥ng</span>
              </label>
              {saveFeatureMutation.error instanceof Error ? <p className="form-error">{saveFeatureMutation.error.message}</p> : null}
              <div className="table-actions--inline">
                <Button disabled={saveFeatureMutation.isPending}>
                  {saveFeatureMutation.isPending ? "Äang lÆ°u..." : featureEditing ? "LÆ°u feature" : "Táº¡o feature"}
                </Button>
                {featureEditing ? (
                  <Button type="button" variant="secondary" onClick={() => setFeatureEditing(null)}>
                    Há»§y sá»­a
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
                      <small>{row.description || "KhÃ´ng cÃ³ mÃ´ táº£"}</small>
                    </div>
                  )
                },
                {
                  key: "active",
                  title: "Tráº¡ng thÃ¡i",
                  render: (row) => <Badge tone={row.active ? "success" : "danger"}>{row.active ? "ACTIVE" : "INACTIVE"}</Badge>
                },
                {
                  key: "actions",
                  title: "",
                  render: (row) => (
                    <div className="table-actions--inline">
                      <Button variant="secondary" onClick={() => setFeatureEditing(row)}>
                        Sá»­a
                      </Button>
                      <Button variant="secondary" onClick={() => setFeaturePendingDelete(row)}>
                        XÃ³a
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
          title={`XÃ³a feature ${featurePendingDelete?.name ?? ""}`}
          description="Feature sáº½ biáº¿n máº¥t khá»i danh sÃ¡ch chá»n khi táº¡o hoáº·c chá»‰nh sá»­a gÃ³i dá»‹ch vá»¥."
          icon="!"
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setFeaturePendingDelete(null)}>
                ÄÃ³ng
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
                {deleteFeatureMutation.isPending ? "Äang xÃ³a..." : "XÃ³a feature"}
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

