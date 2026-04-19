import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, Dialog, Field, Input, Panel, Textarea } from "@paragliding/ui";
import type { ServicePackageWritePayload } from "@paragliding/api-client";
import { adminApi } from "@/shared/config/api";
import { routes } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/lib/format";
import { AdminLayout } from "@/widgets/layout/admin-layout";

const defaultHeroImage = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";
const defaultGalleryImages = [
  "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517022812141-23620dba5c23?auto=format&fit=crop&w=900&q=80"
];

const blankValues: ServicePackageWritePayload = {
  slug: "",
  name: "",
  short_description: "",
  description: "",
  price: "0",
  flight_duration_minutes: 20,
  included_services: [],
  participation_requirements: ["Tuân thủ briefing an toàn"],
  min_child_age: 7,
  hero_image: defaultHeroImage,
  gallery_images: defaultGalleryImages,
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
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toLines = (items: string[]) => items.join("\n");
const fromLines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);

export const ServiceDetailPage = () => {
  const { slug = "" } = useParams();
  const isNew = slug === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<ServicePackageWritePayload>({ defaultValues: blankValues });
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [requirementsText, setRequirementsText] = useState(toLines(blankValues.participation_requirements));
  const [galleryText, setGalleryText] = useState(toLines(blankValues.gallery_images));
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
    () => (featuresQuery.data ?? []).filter((feature) => feature.active || selectedFeatures.includes(feature.name)),
    [featuresQuery.data, selectedFeatures]
  );

  useEffect(() => {
    if (isNew) {
      form.reset(blankValues);
      setSelectedFeatures([]);
      setRequirementsText(toLines(blankValues.participation_requirements));
      setGalleryText(toLines(blankValues.gallery_images));
      return;
    }

    if (serviceQuery.data) {
      form.reset({
        slug: serviceQuery.data.slug,
        name: serviceQuery.data.name,
        short_description: serviceQuery.data.short_description,
        description: serviceQuery.data.description,
        price: serviceQuery.data.price,
        flight_duration_minutes: serviceQuery.data.flight_duration_minutes,
        included_services: serviceQuery.data.included_services,
        participation_requirements: serviceQuery.data.participation_requirements,
        min_child_age: serviceQuery.data.min_child_age,
        hero_image: serviceQuery.data.hero_image,
        gallery_images: serviceQuery.data.gallery_images,
        launch_site_name: serviceQuery.data.launch_site_name,
        launch_lat: serviceQuery.data.launch_lat,
        launch_lng: serviceQuery.data.launch_lng,
        landing_site_name: serviceQuery.data.landing_site_name,
        landing_lat: serviceQuery.data.landing_lat,
        landing_lng: serviceQuery.data.landing_lng,
        featured: serviceQuery.data.featured,
        active: serviceQuery.data.active
      });
      setSelectedFeatures(serviceQuery.data.included_services);
      setRequirementsText(toLines(serviceQuery.data.participation_requirements));
      setGalleryText(toLines(serviceQuery.data.gallery_images));
    }
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

  const toggleFeature = (featureName: string) => {
    setSelectedFeatures((current) =>
      current.includes(featureName)
        ? current.filter((item) => item !== featureName)
        : [...current, featureName]
    );
  };

  const handleSubmit = (values: ServicePackageWritePayload) => {
    const nextSlug = values.slug.trim() || slugify(values.name);
    saveMutation.mutate({
      ...values,
      slug: nextSlug,
      price: String(values.price),
      included_services: selectedFeatures,
      participation_requirements: fromLines(requirementsText),
      gallery_images: fromLines(galleryText)
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
            <Badge>{isNew ? "NEW SERVICE" : serviceQuery.data?.active ? "ACTIVE" : "INACTIVE"}</Badge>
            <h1>{isNew ? "Tạo gói dịch vụ" : serviceQuery.data?.name ?? "Service detail"}</h1>
            <p>Chỉnh tên gói, giá, tổng quan và các dịch vụ đi kèm hiển thị ở customer web.</p>
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
                  <Field label="Giá">
                    <Input type="number" min={0} step={1000} {...form.register("price", { required: true })} />
                  </Field>
                </div>

                <Field label="Tổng quan">
                  <Textarea rows={6} {...form.register("description", { required: true })} />
                </Field>

                <Field label="Mô tả ngắn">
                  <Textarea rows={3} {...form.register("short_description", { required: true })} />
                </Field>

                <Card>
                  <Panel className="admin-stack">
                    <div className="admin-card__header">
                      <div>
                        <h3>Dịch vụ đi kèm</h3>
                        <p>Chọn nhiều feature để đưa vào gói dịch vụ.</p>
                      </div>
                      <Link to={routes.services}>Quản lý feature</Link>
                    </div>
                    <div className="feature-picker">
                      {activeFeatures.map((feature) => (
                        <label key={feature.id} className={`feature-option ${selectedFeatures.includes(feature.name) ? "is-selected" : ""}`}>
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feature.name)}
                            onChange={() => toggleFeature(feature.name)}
                          />
                          <span>
                            <strong>{feature.name}</strong>
                            <small>{feature.description}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                    {!activeFeatures.length ? <p className="row-muted">Chưa có feature. Hãy tạo feature ở trang danh sách Services.</p> : null}
                  </Panel>
                </Card>

                <div className="inline-field-grid inline-field-grid--two">
                  <Field label="Điều kiện tham gia">
                    <Textarea rows={5} value={requirementsText} onChange={(event) => setRequirementsText(event.target.value)} />
                  </Field>
                  <Field label="Gallery images">
                    <Textarea rows={5} value={galleryText} onChange={(event) => setGalleryText(event.target.value)} />
                  </Field>
                </div>
              </div>

              <aside className="post-editor-sidebar">
                <div className="post-publish-card">
                  <Badge>{formatCurrency(priceValue || 0)}</Badge>
                  <strong>{form.watch("name") || "Gói dịch vụ"}</strong>
                  <p>{selectedFeatures.length} feature đã chọn.</p>
                </div>

                <Field label="Slug">
                  <Input {...form.register("slug")} disabled={!isNew} placeholder="Tự tạo nếu bỏ trống" />
                </Field>

                <div className="inline-field-grid inline-field-grid--two">
                  <Field label="Thời lượng bay">
                    <Input type="number" min={10} {...form.register("flight_duration_minutes", { valueAsNumber: true })} />
                  </Field>
                  <Field label="Tuổi tối thiểu">
                    <Input type="number" min={3} {...form.register("min_child_age", { valueAsNumber: true })} />
                  </Field>
                </div>

                <Field label="Hero image">
                  <Input {...form.register("hero_image", { required: true })} />
                </Field>
                {heroImage ? <img className="post-editor-sidebar__thumb" src={heroImage} alt="Service preview" /> : null}

                <Field label="Điểm cất cánh">
                  <Input {...form.register("launch_site_name")} />
                </Field>
                <div className="inline-field-grid inline-field-grid--two">
                  <Field label="Launch lat">
                    <Input type="number" step="0.0001" {...form.register("launch_lat", { valueAsNumber: true })} />
                  </Field>
                  <Field label="Launch lng">
                    <Input type="number" step="0.0001" {...form.register("launch_lng", { valueAsNumber: true })} />
                  </Field>
                </div>

                <Field label="Điểm hạ cánh">
                  <Input {...form.register("landing_site_name")} />
                </Field>
                <div className="inline-field-grid inline-field-grid--two">
                  <Field label="Landing lat">
                    <Input type="number" step="0.0001" {...form.register("landing_lat", { valueAsNumber: true })} />
                  </Field>
                  <Field label="Landing lng">
                    <Input type="number" step="0.0001" {...form.register("landing_lng", { valueAsNumber: true })} />
                  </Field>
                </div>

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
                  <Button disabled={saveMutation.isPending}>{saveMutation.isPending ? "Đang lưu..." : "Lưu gói dịch vụ"}</Button>
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
          description="Gói dịch vụ sau khi xóa sẽ không còn hiển thị ở customer web."
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
