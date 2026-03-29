import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Badge, Button, Card, Field, Input, Panel, SectionTitle, Textarea } from "@paragliding/ui";
import type { ServicePackage, ServicePackageWritePayload } from "@paragliding/api-client";
import { adminApi } from "@/shared/config/api";
import { formatCurrency } from "@/shared/lib/format";
import { AdminLayout } from "@/widgets/layout/admin-layout";
import { DataTable } from "@/widgets/data-table/data-table";

type ServiceFormValues = Omit<
  ServicePackageWritePayload,
  "included_services" | "participation_requirements" | "gallery_images"
> & {
  included_services_text: string;
  participation_requirements_text: string;
  gallery_images_text: string;
};

const blankValues: ServiceFormValues = {
  slug: "",
  name: "",
  short_description: "",
  description: "",
  price: "0",
  flight_duration_minutes: 15,
  min_child_age: 6,
  hero_image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  launch_site_name: "Diem cat canh Son Tra",
  launch_lat: 16.1202,
  launch_lng: 108.2894,
  landing_site_name: "Bai dap Son Tra",
  landing_lat: 16.0941,
  landing_lng: 108.2475,
  featured: false,
  active: true,
  included_services_text: "Phi cong bay doi\nBao hiem co ban\nMu bao ho",
  participation_requirements_text: "Tuan thu briefing an toan\nKhong co benh ly chong chi dinh",
  gallery_images_text:
    "https://images.unsplash.com/photo-1517022812141-23620dba5c23?auto=format&fit=crop&w=900&q=80\nhttps://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80"
};

export const ServicesPage = () => {
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<ServicePackage | null>(null);

  const { data = [] } = useQuery({
    queryKey: ["admin-services"],
    queryFn: () => adminApi.listServices()
  });

  const { register, handleSubmit, reset } = useForm<ServiceFormValues>({
    defaultValues: blankValues
  });

  useEffect(() => {
    if (!selectedService) {
      reset(blankValues);
      return;
    }

    reset({
      ...selectedService,
      included_services_text: selectedService.included_services.join("\n"),
      participation_requirements_text: selectedService.participation_requirements.join("\n"),
      gallery_images_text: selectedService.gallery_images.join("\n")
    });
  }, [reset, selectedService]);

  const saveMutation = useMutation({
    mutationFn: (payload: ServicePackageWritePayload) =>
      selectedService ? adminApi.updateService(selectedService.slug, payload) : adminApi.createService(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      setSelectedService(null);
      reset(blankValues);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => adminApi.deleteService(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      setSelectedService(null);
      reset(blankValues);
    }
  });

  return (
    <AdminLayout>
      <div className="portal-stack">
        <SectionTitle
          eyebrow="Catalog"
          title="Service packages"
          description="Create, update and refine each package from one editor. Keep copy, media, rules and coordinates in sync."
        />

        <div className="admin-grid">
          <Card>
            <Panel className="admin-stack">
              <div className="admin-card__header">
                <div>
                  <h3>{selectedService ? "Edit package" : "Create package"}</h3>
                  <p>Use one structured form for commercial copy, rules and supporting media.</p>
                </div>
                {selectedService ? <Badge>{selectedService.active ? "ACTIVE" : "INACTIVE"}</Badge> : null}
              </div>

              <form
                className="admin-form"
                onSubmit={handleSubmit((values) =>
                  saveMutation.mutate({
                    slug: values.slug,
                    name: values.name,
                    short_description: values.short_description,
                    description: values.description,
                    price: values.price,
                    flight_duration_minutes: Number(values.flight_duration_minutes),
                    min_child_age: Number(values.min_child_age),
                    hero_image: values.hero_image,
                    launch_site_name: values.launch_site_name,
                    launch_lat: Number(values.launch_lat),
                    launch_lng: Number(values.launch_lng),
                    landing_site_name: values.landing_site_name,
                    landing_lat: Number(values.landing_lat),
                    landing_lng: Number(values.landing_lng),
                    featured: Boolean(values.featured),
                    active: Boolean(values.active),
                    included_services: values.included_services_text
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean),
                    participation_requirements: values.participation_requirements_text
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean),
                    gallery_images: values.gallery_images_text
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  })
                )}
              >
                <Field label="Slug">
                  <Input {...register("slug")} />
                </Field>
                <Field label="Service name">
                  <Input {...register("name")} />
                </Field>
                <Field label="Short description">
                  <Textarea {...register("short_description")} />
                </Field>
                <Field label="Full description">
                  <Textarea {...register("description")} />
                </Field>
                <div className="inline-field-grid inline-field-grid--two">
                  <Field label="Price">
                    <Input {...register("price")} />
                  </Field>
                  <Field label="Flight minutes">
                    <Input type="number" {...register("flight_duration_minutes", { valueAsNumber: true })} />
                  </Field>
                </div>
                <div className="inline-field-grid inline-field-grid--two">
                  <Field label="Min child age">
                    <Input type="number" {...register("min_child_age", { valueAsNumber: true })} />
                  </Field>
                  <Field label="Hero image URL">
                    <Input {...register("hero_image")} />
                  </Field>
                </div>
                <Field label="Included services">
                  <Textarea {...register("included_services_text")} />
                </Field>
                <Field label="Participation requirements">
                  <Textarea {...register("participation_requirements_text")} />
                </Field>
                <Field label="Gallery image URLs">
                  <Textarea {...register("gallery_images_text")} />
                </Field>
                {saveMutation.error instanceof Error ? <p className="form-error">{saveMutation.error.message}</p> : null}
                <div className="table-actions--inline">
                  <Button>{selectedService ? "Save package" : "Create package"}</Button>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      setSelectedService(null);
                      reset(blankValues);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </Panel>
          </Card>

          <Card>
            <Panel className="admin-stack">
              <div className="admin-card__header">
                <div>
                  <h3>Package directory</h3>
                  <p>Review price, status and detail access from a cleaner action panel.</p>
                </div>
              </div>

              <DataTable<ServicePackage>
                data={data}
                columns={[
                  {
                    key: "name",
                    title: "Package",
                    render: (row) => (
                      <div className="row-meta">
                        <strong>{row.name}</strong>
                        <span>{row.slug}</span>
                      </div>
                    )
                  },
                  {
                    key: "price",
                    title: "Price",
                    render: (row) => formatCurrency(row.price)
                  },
                  {
                    key: "status",
                    title: "Status",
                    render: (row) => (
                      <Badge tone={row.active ? undefined : "danger"}>{row.active ? "ACTIVE" : "INACTIVE"}</Badge>
                    )
                  },
                  {
                    key: "actions",
                    title: "Actions",
                    render: (row) => (
                      <details className="action-menu">
                        <summary className="action-menu__trigger">Manage</summary>
                        <div className="action-menu__content">
                          <button className="action-menu__item" type="button" onClick={() => setSelectedService(row)}>
                            Edit package
                          </button>
                          <Link to={`/services/${row.slug}`} className="action-menu__item">
                            Open detail
                          </Link>
                          <button
                            className="action-menu__item action-menu__item--danger"
                            type="button"
                            onClick={() => deleteMutation.mutate(row.slug)}
                          >
                            Delete package
                          </button>
                        </div>
                      </details>
                    )
                  }
                ]}
              />
            </Panel>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};
