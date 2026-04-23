import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, Dialog, Field, Input, Panel, Textarea } from "@paragliding/ui";
import type { ServicePackageWritePayload } from "@paragliding/api-client";
import { adminApi } from "@/shared/config/api";
import { routes } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/lib/format";
import { ImageSourceField } from "@/widgets/forms/image-source-field";
import { AdminLayout } from "@/widgets/layout/admin-layout";

const defaultHeroImage =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";

const blankValues: ServicePackageWritePayload = {
  slug: "",
  name: "",
  name_en: "",
  short_description: "",
  short_description_en: "",
  description: "",
  description_en: "",
  price: "0",
  included_feature_ids: [],
  hero_image: defaultHeroImage,
  launch_site_name: "Điểm cất cánh Sơn Trà",
  launch_lat: 16.1202,
  launch_lng: 108.2894,
  landing_site_name: "Bãi đáp Sơn Trà",
  landing_lat: 16.0941,
  landing_lng: 108.2475,
  featured: false,
  active: true
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const ServiceDetailPage = () => {
  const { slug = "" } = useParams();
  const isNew = slug === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<ServicePackageWritePayload>({ defaultValues: blankValues });
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const priceValue = form.watch("price");
  const heroImage = form.watch("hero_image");

  const serviceQuery = useQuery({
    queryKey: ["admin-service", slug],
    queryFn: () => adminApi.getService(slug),
    enabled: Boolean(slug) && !isNew
  });

  const featuresQuery = useQuery({
    queryKey: ["admin-service-features"],
    queryFn: () => adminApi.listServiceFeatures()
  });

  const activeFeatures = useMemo(
    () => (featuresQuery.data ?? []).filter((feature) => feature.active || selectedFeatureIds.includes(feature.id)),
    [featuresQuery.data, selectedFeatureIds]
  );

  useEffect(() => {
    if (isNew) {
      form.reset(blankValues);
      setSelectedFeatureIds([]);
      return;
    }

    if (!serviceQuery.data) {
      return;
    }

    form.reset({
      slug: serviceQuery.data.slug,
      name: serviceQuery.data.name,
      name_en: serviceQuery.data.name_en,
      short_description: serviceQuery.data.short_description,
      short_description_en: serviceQuery.data.short_description_en,
      description: serviceQuery.data.description,
      description_en: serviceQuery.data.description_en,
      price: serviceQuery.data.price,
      included_feature_ids: serviceQuery.data.included_feature_ids,
      hero_image: serviceQuery.data.hero_image,
      launch_site_name: serviceQuery.data.launch_site_name,
      launch_lat: serviceQuery.data.launch_lat,
      launch_lng: serviceQuery.data.launch_lng,
      landing_site_name: serviceQuery.data.landing_site_name,
      landing_lat: serviceQuery.data.landing_lat,
      landing_lng: serviceQuery.data.landing_lng,
      featured: serviceQuery.data.featured,
      active: serviceQuery.data.active
    });
    setSelectedFeatureIds(serviceQuery.data.included_feature_ids);
  }, [form, isNew, serviceQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: ServicePackageWritePayload) =>
      isNew ? adminApi.createService(payload) : adminApi.updateService(slug, payload),
    onSuccess: (servicePackage) => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      navigate(`/services/${servicePackage.slug}`, { replace: true });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteService(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      navigate(routes.services, { replace: true });
    }
  });

  const toggleFeature = (featureId: string) => {
    setSelectedFeatureIds((current) =>
      current.includes(featureId) ? current.filter((item) => item !== featureId) : [...current, featureId]
    );
  };

  const setHeroImage = (nextValue: string) => {
    form.setValue("hero_image", nextValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  };

  const handleSubmit = (values: ServicePackageWritePayload) => {
    saveMutation.mutate({
      ...values,
      slug: values.slug.trim() || slugify(values.name),
      name_en: values.name.trim(),
      short_description_en: values.short_description.trim(),
      description_en: values.description.trim(),
      price: String(values.price),
      included_feature_ids: selectedFeatureIds
    });
  };

  if (!slug) {
    return <Navigate to={routes.services} replace />;
  }

  return (
    <AdminLayout>
      <div className="portal-stack">
        <div className="portal-heading">
          <div className="portal-heading__text">
            <Badge>{isNew ? "Gói mới" : serviceQuery.data?.active ? "Đang bán" : "Tạm tắt"}</Badge>
            <h1>{isNew ? "Tạo gói dịch vụ" : serviceQuery.data?.name ?? "Chi tiết dịch vụ"}</h1>
            <p>Chỉnh tên gói, giá, ảnh đại diện và các dịch vụ đi kèm hiển thị cho khách hàng.</p>
          </div>
          <Link to={routes.services}>
            <Button variant="secondary">Quay lại danh sách</Button>
          </Link>
        </div>

        <Card className="post-editor-card">
          <Panel className="admin-stack">
            <form className="service-editor-layout" onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="admin-stack">
                <div className="inline-field-grid inline-field-grid--two">
                  <Field label="Tên gói dịch vụ">
                    <Input {...form.register("name", { required: true })} />
                  </Field>
                </div>

                <div className="inline-field-grid inline-field-grid--two">
                  <Field label="Giá">
                    <Input type="number" min={0} step={1000} {...form.register("price", { required: true })} />
                  </Field>
                </div>

                <div className="inline-field-grid inline-field-grid--two">
                  <Field label="Tổng quan">
                    <Textarea rows={6} {...form.register("description", { required: true })} />
                  </Field>
                </div>

                <div className="inline-field-grid inline-field-grid--two">
                  <Field label="Mô tả ngắn">
                    <Textarea rows={3} {...form.register("short_description", { required: true })} />
                  </Field>
                </div>

                <Card>
                  <Panel className="admin-stack">
                    <div className="admin-card__header">
                      <div>
                        <h3>Dịch vụ đi kèm</h3>
                        <p>Chọn nhiều mục để đưa vào gói dịch vụ.</p>
                      </div>
                      <Link to={routes.services}>Quản lý dịch vụ đi kèm</Link>
                    </div>
                    <div className="feature-picker">
                      {activeFeatures.map((feature) => (
                        <label
                          key={feature.id}
                          className={`feature-option ${selectedFeatureIds.includes(feature.id) ? "is-selected" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedFeatureIds.includes(feature.id)}
                            onChange={() => toggleFeature(feature.id)}
                          />
                          <span>
                            <strong>{feature.name}</strong>
                            <small>{feature.description}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                    {!activeFeatures.length ? (
                      <p className="row-muted">Chưa có dịch vụ đi kèm. Hãy tạo ở trang danh sách dịch vụ.</p>
                    ) : null}
                  </Panel>
                </Card>
              </div>

              <aside className="post-editor-sidebar">
                <div className="post-publish-card">
                  <Badge>{formatCurrency(priceValue || 0)}</Badge>
                  <strong>{form.watch("name") || "Gói dịch vụ"}</strong>
                  <p>{selectedFeatureIds.length} dịch vụ đi kèm đã chọn.</p>
                </div>

                <Field label="Slug">
                  <Input {...form.register("slug")} disabled={!isNew} placeholder="Tự tạo nếu bỏ trống" />
                </Field>

                <ImageSourceField
                  label="Ảnh đại diện"
                  value={heroImage}
                  previewAlt="Xem trước ảnh dịch vụ"
                  placeholder="https://..."
                  onChange={setHeroImage}
                />
                <input type="hidden" {...form.register("hero_image", { required: true })} />
                <input type="hidden" {...form.register("launch_site_name")} />
                <input type="hidden" {...form.register("launch_lat", { valueAsNumber: true })} />
                <input type="hidden" {...form.register("launch_lng", { valueAsNumber: true })} />
                <input type="hidden" {...form.register("landing_site_name")} />
                <input type="hidden" {...form.register("landing_lat", { valueAsNumber: true })} />
                <input type="hidden" {...form.register("landing_lng", { valueAsNumber: true })} />

                <label className="admin-checkbox">
                  <input type="checkbox" {...form.register("featured")} />
                  <span>Gói nổi bật</span>
                </label>
                <label className="admin-checkbox">
                  <input type="checkbox" {...form.register("active")} />
                  <span>Đang mở bán</span>
                </label>

                {saveMutation.error instanceof Error ? <p className="form-error">{saveMutation.error.message}</p> : null}
                {deleteMutation.error instanceof Error ? <p className="form-error">{deleteMutation.error.message}</p> : null}

                <div className="post-editor-sidebar__actions">
                  <Button disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Đang lưu..." : "Lưu gói dịch vụ"}
                  </Button>
                  {!isNew ? (
                    <Button type="button" variant="secondary" onClick={() => setDeleteDialogOpen(true)}>
                      Xóa gói dịch vụ
                    </Button>
                  ) : null}
                </div>
              </aside>
            </form>
          </Panel>
        </Card>

        <Dialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            if (!deleteMutation.isPending) {
              setDeleteDialogOpen(open);
            }
          }}
          title={`Xóa gói dịch vụ ${form.watch("name") || slug}`}
          description="Gói dịch vụ sau khi xóa sẽ không còn hiển thị trên website khách hàng."
          icon="!"
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
                Đóng
              </Button>
              <Button type="button" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
                {deleteMutation.isPending ? "Đang xóa..." : "Xóa gói dịch vụ"}
              </Button>
            </>
          }
        >
          {deleteMutation.error instanceof Error ? <p className="form-error">{deleteMutation.error.message}</p> : null}
        </Dialog>
      </div>
    </AdminLayout>
  );
};

